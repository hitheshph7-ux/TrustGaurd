from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.vendor import TrustedVendor
from app.models.scan import ScanHistory

def analyze_invoice(
    db: Session,
    vendor_name: str,
    invoice_number: str,
    vendor_domain: str,
    bank_account: str,
    ifsc_code: str,
    amount: float,
    due_date: str = ""
) -> Dict[str, Any]:
    reasons: List[str] = []
    recommendations: List[str] = []
    score = 0
    
    clean_vendor_name = vendor_name.strip()
    clean_invoice_num = invoice_number.strip()
    clean_domain = vendor_domain.strip().lower()
    clean_account = bank_account.strip().replace(" ", "").replace("-", "")
    clean_ifsc = ifsc_code.strip().upper()

    # 1. Look up Vendor in Database
    trusted_vendor = db.query(TrustedVendor).filter(
        (TrustedVendor.name.ilike(f"%{clean_vendor_name}%")) | 
        (TrustedVendor.domain.ilike(clean_domain))
    ).first()

    vendor_registered = False
    
    if not trusted_vendor:
        score += 55
        reasons.append(f"[Vendor Audit] Vendor '{clean_vendor_name}' ({clean_domain}) is NOT found in your Trusted Vendor Directory.")
        recommendations.append("Perform an out-of-band verification (call vendor via official phone number) before registering new payment details.")
    else:
        vendor_registered = True
        reasons.append(f"[Vendor Audit] Vendor '{trusted_vendor.name}' is registered in Trusted Vendor Directory (Status: {trusted_vendor.verification_status.upper()}).")

        # Invoice Reference Pattern Check
        if trusted_vendor.invoice_ref:
            if trusted_vendor.invoice_ref.lower() in clean_invoice_num.lower() or clean_invoice_num.lower() in trusted_vendor.invoice_ref.lower():
                reasons.append(f"[Vendor Audit] Invoice reference '{clean_invoice_num}' matches registered vendor reference pattern '{trusted_vendor.invoice_ref}'.")
            else:
                score += 15
                reasons.append(f"[Ref Mismatch] Invoice reference '{clean_invoice_num}' differs from registered vendor reference prefix '{trusted_vendor.invoice_ref}'.")

        # 2. Bank Account Mismatch Check
        trusted_acc_clean = trusted_vendor.bank_account.strip().replace(" ", "").replace("-", "")
        if clean_account != trusted_acc_clean:
            score += 70
            reasons.append(f"[CRITICAL FRAUD WARNING] Bank account mismatch! Submitted: '{bank_account}' vs Registered Trusted Account: '{trusted_vendor.bank_account}'.")
            recommendations.append("HOLD PAYMENT IMMEDIATELY. Bank account details differ from verified records. Potential Invoice Redirection Attack!")
        else:
            reasons.append("[Vendor Audit] Bank account number matches registered records.")

        # 3. IFSC / Routing Code Mismatch Check
        trusted_ifsc_clean = trusted_vendor.ifsc_code.strip().upper()
        if clean_ifsc != trusted_ifsc_clean:
            score += 45
            reasons.append(f"[CRITICAL FRAUD WARNING] IFSC/Routing code mismatch! Submitted: '{ifsc_code}' vs Registered: '{trusted_vendor.ifsc_code}'.")
            recommendations.append("Verify bank branch details with vendor finance department directly.")
        else:
            reasons.append("[Vendor Audit] IFSC/Routing code matches registered records.")

        # 4. Vendor Domain Mismatch Check
        trusted_domain_clean = trusted_vendor.domain.strip().lower()
        if clean_domain != trusted_domain_clean:
            score += 40
            reasons.append(f"[Security Check] Vendor domain mismatch! Submitted email domain: '{clean_domain}' vs Approved domain: '{trusted_domain_clean}'.")
            recommendations.append("Confirm email header sender origin matches official vendor domain.")

        # 5. Amount Anomaly / Threshold Check
        if trusted_vendor.max_typical_amount and amount > trusted_vendor.max_typical_amount:
            score += 25
            reasons.append(f"[Amount Anomaly] Invoice amount (${amount:,.2f}) exceeds typical maximum threshold (${trusted_vendor.max_typical_amount:,.2f}) for this vendor.")
            recommendations.append("Require dual-signoff authorization for invoices exceeding routine operational thresholds.")

    # 6. Basic Input Validation Checks
    if amount <= 0:
        score += 30
        reasons.append("[Validation Error] Invoice amount must be greater than zero.")
        
    # 7. Duplicate Invoice Number Check in Scan History
    existing_scan = db.query(ScanHistory).filter(
        ScanHistory.scan_type == "invoice",
        ScanHistory.target_identifier.ilike(f"%{clean_invoice_num}%")
    ).first()

    if existing_scan:
        score += 35
        reasons.append(f"[Duplicate Check] Warning: Invoice number '{clean_invoice_num}' was previously submitted for security scanning (Scan ID #{existing_scan.id}).")
        recommendations.append("Check accounting software to prevent duplicate invoice payment processing.")

    # Risk Level Categorization
    final_score = min(100, score)
    if final_score >= 60:
        risk_level = "High"
    elif final_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    recommendations.append("Compliance Protocol: Never update vendor bank details based solely on email requests without strict out-of-band telephone verification.")

    target_identifier = f"Invoice {clean_invoice_num} ({clean_vendor_name})"

    return {
        "scan_type": "invoice",
        "target_identifier": target_identifier,
        "risk_level": risk_level,
        "risk_score": final_score,
        "reasons": reasons,
        "recommendations": recommendations,
        "details": {
            "vendor_name": clean_vendor_name,
            "invoice_number": clean_invoice_num,
            "vendor_domain": clean_domain,
            "bank_account_submitted": bank_account,
            "ifsc_code_submitted": ifsc_code,
            "amount": amount,
            "due_date": due_date,
            "vendor_registered": vendor_registered,
            "assessment_classification": "Trusted Vendor Cross-Verification & Fraud Rules"
        }
    }
