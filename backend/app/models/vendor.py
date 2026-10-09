import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class TrustedVendor(Base):
    __tablename__ = "trusted_vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    bank_account = Column(String(50), nullable=False)
    ifsc_code = Column(String(20), nullable=False) # IFSC or Routing / SWIFT code
    invoice_ref = Column(String(100), nullable=True) # Invoice Reference Number / Prefix e.g. INV-2024-001
    approved_by = Column(String(100), default="Security Admin")
    verification_status = Column(String(20), default="verified") # "verified", "pending", "flagged"
    max_typical_amount = Column(Float, nullable=True) # Optional threshold check
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
