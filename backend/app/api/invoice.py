from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.scan import InvoiceScanRequest, ScanResultResponse
from app.services.invoice_detector import analyze_invoice
from app.models.scan import ScanHistory
from app.models.user import User

router = APIRouter(prefix="/scans", tags=["Invoice Verification"])

@router.post("/invoice", response_model=ScanResultResponse, status_code=status.HTTP_201_CREATED)
def scan_invoice(req: InvoiceScanRequest, db: Session = Depends(get_db)):
    if not req.vendor_name.strip() or not req.invoice_number.strip() or not req.bank_account.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor Name, Invoice Number, and Bank Account are required."
        )

    result_data = analyze_invoice(
        db=db,
        vendor_name=req.vendor_name,
        invoice_number=req.invoice_number,
        vendor_domain=req.vendor_domain,
        bank_account=req.bank_account,
        ifsc_code=req.ifsc_code,
        amount=req.amount,
        due_date=req.due_date or ""
    )

    target_user_id = req.user_id
    if not target_user_id:
        first_user = db.query(User).first()
        target_user_id = first_user.id if first_user else 1

    db_scan = ScanHistory(
        user_id=target_user_id,
        scan_type=result_data["scan_type"],
        risk_level=result_data["risk_level"],
        risk_score=result_data["risk_score"],
        target_identifier=result_data["target_identifier"],
        reasons=result_data["reasons"],
        recommendations=result_data["recommendations"],
        details=result_data["details"]
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    return db_scan
