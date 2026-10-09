from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.scan import UrlScanRequest, ScanResultResponse
from app.services.url_detector import analyze_url
from app.models.scan import ScanHistory
from app.models.user import User

router = APIRouter(prefix="/scans", tags=["URL Security"])

@router.post("/url", response_model=ScanResultResponse, status_code=status.HTTP_201_CREATED)
def scan_url(req: UrlScanRequest, db: Session = Depends(get_db)):
    if not req.url or not req.url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL string is required."
        )

    result_data = analyze_url(url_input=req.url)

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
