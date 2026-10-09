from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.scan import EmailScanRequest, ScanResultResponse
from app.services.email_detector import analyze_email
from app.models.scan import ScanHistory
from app.models.user import User

router = APIRouter(prefix="/scans", tags=["Email Security"])

@router.post("/email", response_model=ScanResultResponse, status_code=status.HTTP_201_CREATED)
def scan_email(req: EmailScanRequest, db: Session = Depends(get_db)):
    if not req.sender.strip() or not req.body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sender address and Email body are required fields."
        )

    result_data = analyze_email(subject=req.subject, sender=req.sender, body=req.body)

    # Determine user_id: use provided user_id, or default to first admin user in database
    target_user_id = req.user_id
    if not target_user_id:
        first_user = db.query(User).first()
        target_user_id = first_user.id if first_user else 1

    # Store in database
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
