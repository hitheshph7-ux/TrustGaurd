from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class EmailScanRequest(BaseModel):
    subject: Optional[str] = Field(default="", description="Email subject line")
    sender: str = Field(..., description="Email sender address or display name")
    body: str = Field(..., description="Email body text")
    user_id: Optional[int] = Field(default=None, description="Logged in user ID for isolated scans")

class UrlScanRequest(BaseModel):
    url: str = Field(..., description="URL to be scanned for security risks")
    user_id: Optional[int] = Field(default=None, description="Logged in user ID for isolated scans")

class InvoiceScanRequest(BaseModel):
    vendor_name: str = Field(..., description="Name of vendor issuing invoice")
    invoice_number: str = Field(..., description="Invoice reference number")
    vendor_domain: str = Field(..., description="Vendor email or website domain")
    bank_account: str = Field(..., description="Bank account number for payment")
    ifsc_code: str = Field(..., description="IFSC code or Routing number")
    amount: float = Field(..., description="Total invoice amount")
    due_date: Optional[str] = Field(default="", description="Payment due date")
    user_id: Optional[int] = Field(default=None, description="Logged in user ID for isolated scans")

class ScanResultResponse(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    scan_type: str
    risk_level: str  # "Low", "Medium", "High"
    risk_score: int  # 0 - 100
    target_identifier: str
    reasons: List[str]
    recommendations: List[str]
    details: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DashboardStatsResponse(BaseModel):
    total_scans: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    type_counts: Dict[str, int]
    recent_scans: List[ScanResultResponse]
