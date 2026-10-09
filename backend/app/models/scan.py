import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from app.database import Base

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    scan_type = Column(String(20), index=True) # "email", "url", "invoice"
    risk_level = Column(String(20), index=True) # "Low", "Medium", "High"
    risk_score = Column(Integer) # 0 to 100
    target_identifier = Column(String(255), index=True) # e.g. Email Subject/Sender, URL, Invoice #
    reasons = Column(JSON) # List of string findings/reasons
    recommendations = Column(JSON) # List of recommended actions
    details = Column(JSON) # Detailed analysis findings & metadata
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
