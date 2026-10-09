import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    vendor_id = Column(Integer, ForeignKey("trusted_vendors.id"), nullable=True, index=True)
    vendor_name = Column(String(100), nullable=False)
    invoice_number = Column(String(100), nullable=False)
    normalized_invoice_number = Column(String(100), index=True, nullable=False)
    bank_account_masked = Column(String(50), nullable=False)
    bank_account_hash = Column(String(64), nullable=True) # SHA256 or exact lookup key
    ifsc_code = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(String(50), nullable=True)
    risk_level = Column(String(20), default="Low")
    verification_status = Column(String(20), default="verified") # "verified", "pending_review", "flagged"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
