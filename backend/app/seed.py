import sys
import os
from sqlalchemy.orm import Session

# Add current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.vendor import TrustedVendor
from app.models.scan import ScanHistory
from app.models.user import User
from app.core.security import hash_password

DEMO_VENDORS = [
    {
        "name": "Acme Industrial Supplies",
        "domain": "acme-supplies.com",
        "invoice_ref": "INV-2024-ACME",
        "bank_account": "987654321098",
        "ifsc_code": "SBIN0001234",
        "approved_by": "Chief Security Officer",
        "verification_status": "verified",
        "max_typical_amount": 50000.00
    },
    {
        "name": "TechSupply Hardware Corp",
        "domain": "techsupply.io",
        "invoice_ref": "INV-2024-TECH",
        "bank_account": "112233445566",
        "ifsc_code": "HDFC0005678",
        "approved_by": "Finance Lead",
        "verification_status": "verified",
        "max_typical_amount": 125000.00
    },
    {
        "name": "CloudServices Global LLC",
        "domain": "cloudservices-global.com",
        "invoice_ref": "INV-2024-CLOUD",
        "bank_account": "556677889900",
        "ifsc_code": "ICIC0009012",
        "approved_by": "IT Administrator",
        "verification_status": "verified",
        "max_typical_amount": 35000.00
    },
    {
        "name": "GlobalLogistics Freight Services",
        "domain": "globallogistics.net",
        "invoice_ref": "INV-2024-LOG",
        "bank_account": "998877665544",
        "ifsc_code": "UTIB0003456",
        "approved_by": "Operations Manager",
        "verification_status": "verified",
        "max_typical_amount": 80000.00
    }
]

DEMO_SCANS = [
    {
        "scan_type": "email",
        "risk_level": "High",
        "risk_score": 88,
        "target_identifier": "URGENT: Payroll Account Suspension Notice",
        "reasons": [
            "[Heuristic] High urgency & psychological pressure detected (keywords: urgent, suspended, 24 hours)",
            "[Heuristic] Password or credential update request identified in email text.",
            "[ML Model] Baseline classifier assigned 92% probability of phishing."
        ],
        "recommendations": [
            "Do not click links inside the email.",
            "Report email to Internal Security Operations Team immediately."
        ],
        "details": {
            "sender": "Security Alert <support@verify-bank-update-portal.xyz>",
            "subject": "URGENT: Payroll Account Suspension Notice",
            "assessment_classification": "Synthetic Demo Scan"
        }
    },
    {
        "scan_type": "url",
        "risk_level": "High",
        "risk_score": 92,
        "target_identifier": "http://paypal.login.secure-auth-update.xyz/verify",
        "reasons": [
            "[Heuristic] URL uses insecure HTTP protocol.",
            "[Heuristic] High-risk top-level domain '.xyz' detected.",
            "[Heuristic] Potential brand impersonation: Hostname contains 'paypal' but official domain is 'paypal.com'."
        ],
        "recommendations": [
            "Do not navigate to this site in your browser.",
            "Block hostname on corporate DNS resolvers."
        ],
        "details": {
            "submitted_url": "http://paypal.login.secure-auth-update.xyz/verify",
            "parsed_hostname": "paypal.login.secure-auth-update.xyz",
            "assessment_classification": "Synthetic Demo Scan"
        }
    },
    {
        "scan_type": "invoice",
        "risk_level": "High",
        "risk_score": 75,
        "target_identifier": "Invoice INV-2024-99 (Acme Industrial Supplies)",
        "reasons": [
            "[CRITICAL FRAUD WARNING] Bank account mismatch! Submitted: '999988887777' vs Registered Trusted Account: '987654321098'."
        ],
        "recommendations": [
            "HOLD PAYMENT IMMEDIATELY. Bank account details differ from verified records."
        ],
        "details": {
            "vendor_name": "Acme Industrial Supplies",
            "invoice_number": "INV-2024-99",
            "amount": 45000.00,
            "assessment_classification": "Synthetic Demo Scan"
        }
    },
    {
        "scan_type": "email",
        "risk_level": "Low",
        "risk_score": 12,
        "target_identifier": "Q3 Financial Operations Meeting Agenda",
        "reasons": [
            "[Heuristic & ML] No high-risk phishing indicators detected in the provided email text."
        ],
        "recommendations": [
            "Standard business message. Maintain routine security vigilance."
        ],
        "details": {
            "sender": "Finance Team <finance@company.com>",
            "subject": "Q3 Financial Operations Meeting Agenda",
            "assessment_classification": "Synthetic Demo Scan"
        }
    },
    {
        "scan_type": "url",
        "risk_level": "Low",
        "risk_score": 5,
        "target_identifier": "https://github.com/fastapi/fastapi",
        "reasons": [
            "[Heuristic] Standard URL structure. No obvious structural anomalies identified."
        ],
        "recommendations": [
            "Ensure HTTPS indicator is active in browser address bar."
        ],
        "details": {
            "submitted_url": "https://github.com/fastapi/fastapi",
            "assessment_classification": "Synthetic Demo Scan"
        }
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Seed Vendors if table empty
        if db.query(TrustedVendor).count() == 0:
            print("Seeding synthetic trusted vendors...")
            for v_data in DEMO_VENDORS:
                vendor = TrustedVendor(**v_data)
                db.add(vendor)
            db.commit()
            print(f"Successfully seeded {len(DEMO_VENDORS)} trusted vendors.")
            
        # Seed Scans if table empty
        if db.query(ScanHistory).count() == 0:
            print("Seeding initial scan history...")
            for s_data in DEMO_SCANS:
                scan = ScanHistory(**s_data)
                db.add(scan)
            db.commit()
            print(f"Successfully seeded {len(DEMO_SCANS)} initial scan history records.")

        # Seed Default Master Admin User if no users exist
        if db.query(User).count() == 0:
            print("Seeding default master admin user...")
            demo_admin = User(
                email="admin@trustguard.sec",
                full_name="Master Security Officer",
                password_hash=hash_password("AdminPassword123!"),
                role="admin"
            )
            db.add(demo_admin)
            db.commit()
            print("Successfully seeded master admin user (admin@trustguard.sec).")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
