from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.vendor import TrustedVendor
from app.models.invoice import Invoice
from app.models.vendor_history import VendorBankHistory
from app.services.invoice_detector import analyze_invoice, mask_bank_account, normalize_invoice_number

def test_invoice_mismatch_detection():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    vendor = TrustedVendor(
        name="Acme Corp",
        domain="acme-supplies.com",
        bank_account="1234567890",
        ifsc_code="ACME0001",
        approved_by="Admin"
    )
    db.add(vendor)
    db.commit()

    res = analyze_invoice(
        db=db,
        vendor_name="Acme Corp",
        invoice_number="INV-001",
        vendor_domain="acme-supplies.com",
        bank_account="9999999999", # Mismatched bank account
        ifsc_code="ACME0001",
        amount=500.0
    )
    
    assert res["risk_level"] == "High"
    assert res["risk_score"] >= 60
    assert any("mismatch" in r.lower() for r in res["reasons"])

def test_invoice_exact_duplicate_and_anomaly():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    vendor = TrustedVendor(
        name="TechCorp Supplies",
        domain="techcorp.com",
        bank_account="555566667777",
        ifsc_code="TECH0001"
    )
    db.add(vendor)
    db.commit()

    # Pre-insert historical invoice
    inv1 = Invoice(
        user_id=1,
        vendor_id=vendor.id,
        vendor_name="TechCorp Supplies",
        invoice_number="INV-2024-100",
        normalized_invoice_number=normalize_invoice_number("INV-2024-100"),
        bank_account_masked=mask_bank_account("555566667777"),
        ifsc_code="TECH0001",
        amount=1000.0
    )
    db.add(inv1)
    db.commit()

    # Test exact duplicate detection
    dup_res = analyze_invoice(
        db=db,
        vendor_name="TechCorp Supplies",
        invoice_number="inv-2024-100", # Normalized matching inv2024100
        vendor_domain="techcorp.com",
        bank_account="555566667777",
        ifsc_code="TECH0001",
        amount=1000.0
    )

    assert dup_res["details"]["is_duplicate"] is True
    assert any("duplicate" in r.lower() for r in dup_res["reasons"])

def test_bank_account_masking():
    masked = mask_bank_account("987654321098")
    assert "1098" in masked
    assert "9876" not in masked
