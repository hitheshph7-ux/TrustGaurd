from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.scan import ScanHistory
from app.schemas.scan import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    user_id: Optional[int] = Query(None, description="Optional User ID to isolate telemetry dashboard"),
    db: Session = Depends(get_db)
):
    query = db.query(ScanHistory)
    if user_id is not None:
        query = query.filter(ScanHistory.user_id == user_id)

    total_scans = query.count()
    
    high_count = query.filter(ScanHistory.risk_level == "High").count()
    medium_count = query.filter(ScanHistory.risk_level == "Medium").count()
    low_count = query.filter(ScanHistory.risk_level == "Low").count()

    email_count = query.filter(ScanHistory.scan_type == "email").count()
    url_count = query.filter(ScanHistory.scan_type == "url").count()
    invoice_count = query.filter(ScanHistory.scan_type == "invoice").count()

    recent_scans = query.order_by(ScanHistory.created_at.desc()).limit(10).all()

    return {
        "total_scans": total_scans,
        "high_risk_count": high_count,
        "medium_risk_count": medium_count,
        "low_risk_count": low_count,
        "type_counts": {
            "email": email_count,
            "url": url_count,
            "invoice": invoice_count
        },
        "recent_scans": recent_scans
    }
