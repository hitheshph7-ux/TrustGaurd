from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.vendor import TrustedVendor
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse

router = APIRouter(prefix="/vendors", tags=["Trusted Vendors"])

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
    return db_vendor

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
