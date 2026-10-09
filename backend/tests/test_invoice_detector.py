from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.vendor import TrustedVendor
from app.services.invoice_detector import analyze_invoice

def test_invoice_mismatch_detection():
    # Set up in-memory sqlite test DB
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    # Add trusted vendor
    vendor = TrustedVendor(
        name="Acme Corp",
        domain="acme-supplies.com",
        bank_account="1234567890",
        ifsc_code="ACME0001",
        approved_by="Admin"
    )
    db.add(vendor)
    db.commit()

    # Test bank account mismatch
    res = analyze_invoice(
        db=db,
        vendor_name="Acme Corp",
        invoice_number="INV-001",
        vendor_domain="acme-supplies.com",
        bank_account="9999999999", # Mismatched bank account!
        ifsc_code="ACME0001",
        amount=500.0
    )
    
    assert res["risk_level"] == "High"
    assert res["risk_score"] >= 60
    assert any("mismatch" in r.lower() for r in res["reasons"])

def test_invoice_unregistered_vendor():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    res = analyze_invoice(
        db=db,
        vendor_name="Unknown Entity Inc",
        invoice_number="INV-999",
        vendor_domain="unknown-entity.xyz",
        bank_account="111122223333",
        ifsc_code="UNKN0001",
        amount=1000.0
    )
    
    assert res["risk_level"] in ["High", "Medium"]
    assert any("not found" in r.lower() for r in res["reasons"])
