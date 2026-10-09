from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.vendor import TrustedVendor
from app.models.vendor_history import VendorBankHistory
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.services.invoice_detector import mask_bank_account

router = APIRouter(prefix="/vendors", tags=["Trusted Vendors"])

class BankChangeRequest(BaseModel):
    new_bank_account: str
    new_ifsc_code: Optional[str] = ""
    requested_by: Optional[str] = "Finance Administrator"
    change_reason: Optional[str] = "Vendor updated official payment invoice instructions"

class BankChangeApprovalRequest(BaseModel):
    approved_by: str = "Chief Security Officer"

@router.get("", response_model=List[VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    return db.query(TrustedVendor).order_by(TrustedVendor.name.asc()).all()

@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_in: VendorCreate, db: Session = Depends(get_db)):
    existing = db.query(TrustedVendor).filter(
        (TrustedVendor.name.ilike(vendor_in.name.strip())) | 
        (TrustedVendor.domain.ilike(vendor_in.domain.strip()))
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vendor with name '{vendor_in.name}' or domain '{vendor_in.domain}' already exists."
        )

    db_vendor = TrustedVendor(
        name=vendor_in.name.strip(),
        domain=vendor_in.domain.strip().lower(),
        invoice_ref=vendor_in.invoice_ref.strip() if vendor_in.invoice_ref else "",
        bank_account=vendor_in.bank_account.strip(),
        ifsc_code=vendor_in.ifsc_code.strip().upper(),
        approved_by=vendor_in.approved_by or "Security Admin",
        verification_status=vendor_in.verification_status or "verified",
        max_typical_amount=vendor_in.max_typical_amount
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)

    # Initial bank account audit log
    history = VendorBankHistory(
        vendor_id=db_vendor.id,
        old_bank_account_masked="N/A (Initial Registration)",
        new_bank_account_masked=mask_bank_account(db_vendor.bank_account),
        old_ifsc="N/A",
        new_ifsc=db_vendor.ifsc_code,
        requested_by="System Setup",
        approved_by=db_vendor.approved_by,
        status="verified",
        change_reason="Initial Vendor Onboarding"
    )
    db.add(history)
    db.commit()

    return db_vendor

@router.get("/{vendor_id}/history")
def get_vendor_bank_history(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(TrustedVendor).filter(TrustedVendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")
    
    history_records = db.query(VendorBankHistory).filter(VendorBankHistory.vendor_id == vendor_id).order_by(VendorBankHistory.created_at.desc()).all()
    return {
        "vendor_id": vendor_id,
        "vendor_name": vendor.name,
        "current_bank_account_masked": mask_bank_account(vendor.bank_account),
        "history": history_records
    }

@router.post("/{vendor_id}/bank-change")
def request_bank_account_change(vendor_id: int, req: BankChangeRequest, db: Session = Depends(get_db)):
    vendor = db.query(TrustedVendor).filter(TrustedVendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    old_masked = mask_bank_account(vendor.bank_account)
    new_masked = mask_bank_account(req.new_bank_account)

    history = VendorBankHistory(
        vendor_id=vendor_id,
        old_bank_account_masked=old_masked,
        new_bank_account_masked=new_masked,
        old_ifsc=vendor.ifsc_code,
        new_ifsc=req.new_ifsc_code or vendor.ifsc_code,
        requested_by=req.requested_by,
        approved_by="Pending Out-of-Band Call Verification",
        status="pending_approval",
        change_reason=req.change_reason
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "message": f"Bank account change request submitted for {vendor.name}. Pending out-of-band telephone verification.",
        "history_id": history.id,
        "status": "pending_approval",
        "old_bank_account_masked": old_masked,
        "new_bank_account_masked": new_masked
    }

@router.post("/{vendor_id}/approve-bank-change/{history_id}")
def approve_bank_account_change(vendor_id: int, history_id: int, req: BankChangeApprovalRequest, db: Session = Depends(get_db)):
    vendor = db.query(TrustedVendor).filter(TrustedVendor.id == vendor_id).first()
    history = db.query(VendorBankHistory).filter(VendorBankHistory.id == history_id, VendorBankHistory.vendor_id == vendor_id).first()
    
    if not vendor or not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor or Bank Change History Record not found.")

    if history.status == "verified":
        return {"message": "Bank change request has already been verified and approved.", "vendor": vendor}

    # Update Vendor details and mark history as verified
    history.status = "verified"
    history.approved_by = req.approved_by
    vendor.approved_by = req.approved_by
    
    db.commit()
    db.refresh(vendor)
    db.refresh(history)

    return {
        "message": f"Bank account change for {vendor.name} verified and approved by {req.approved_by}.",
        "vendor_id": vendor_id,
        "history_id": history_id,
        "new_bank_account_masked": history.new_bank_account_masked,
        "approved_by": req.approved_by,
        "status": "verified"
    }

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor_in: VendorUpdate, db: Session = Depends(get_db)):
    db_vendor = db.query(TrustedVendor).filter(TrustedVendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor ID #{vendor_id} not found."
        )

    update_data = vendor_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if key == "domain":
                value = value.strip().lower()
            elif key == "ifsc_code":
                value = value.strip().upper()
            elif key == "invoice_ref":
                value = value.strip()
            setattr(db_vendor, key, value)

    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    db_vendor = db.query(TrustedVendor).filter(TrustedVendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor ID #{vendor_id} not found."
        )
    db.delete(db_vendor)
    db.commit()
    return None
