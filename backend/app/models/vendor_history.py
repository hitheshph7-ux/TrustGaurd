import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base

class VendorBankHistory(Base):
    __tablename__ = "vendor_bank_history"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("trusted_vendors.id"), nullable=False, index=True)
    old_bank_account_masked = Column(String(50), nullable=False)
    new_bank_account_masked = Column(String(50), nullable=False)
    old_ifsc = Column(String(20), nullable=True)
    new_ifsc = Column(String(20), nullable=True)
    requested_by = Column(String(100), default="Finance System")
    approved_by = Column(String(100), default="Pending Verification")
    status = Column(String(20), default="pending_approval") # "verified", "pending_approval", "rejected"
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
