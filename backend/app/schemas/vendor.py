from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class VendorBase(BaseModel):
    name: str = Field(..., description="Vendor business name")
    domain: str = Field(..., description="Vendor primary email/web domain")
    invoice_ref: Optional[str] = Field(default="", description="Invoice Reference Number or Prefix")
    bank_account: str = Field(..., description="Verified bank account number")
    ifsc_code: str = Field(..., description="Verified IFSC or routing code")
    approved_by: Optional[str] = Field(default="Security Admin", description="Officer who verified vendor")
    verification_status: Optional[str] = Field(default="verified", description="verified, pending, or flagged")
    max_typical_amount: Optional[float] = Field(default=None, description="Maximum expected invoice amount threshold")

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    invoice_ref: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    approved_by: Optional[str] = None
    verification_status: Optional[str] = None
    max_typical_amount: Optional[float] = None

class VendorResponse(VendorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
