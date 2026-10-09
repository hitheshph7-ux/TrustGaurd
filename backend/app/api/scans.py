from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.scan import ScanHistory
from app.schemas.scan import ScanResultResponse

router = APIRouter(prefix="/scans", tags=["Scan History"])

@router.get("", response_model=List[ScanResultResponse])
def get_scans(
    user_id: Optional[int] = Query(None, description="Filter by user ID for isolated session history"),
    scan_type: Optional[str] = Query(None, description="Filter by scan type: email, url, invoice"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: Low, Medium, High"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(ScanHistory)
    if user_id is not None and user_id > 0:
        query = query.filter(ScanHistory.user_id == user_id)
    if scan_type:
        query = query.filter(ScanHistory.scan_type == scan_type.lower())
    if risk_level:
        query = query.filter(ScanHistory.risk_level.ilike(risk_level))

    scans = query.order_by(ScanHistory.created_at.desc()).offset(offset).limit(limit).all()
    return scans

@router.get("/{scan_id}", response_model=ScanResultResponse)
def get_scan_by_id(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan record with ID #{scan_id} not found."
        )
    return scan
