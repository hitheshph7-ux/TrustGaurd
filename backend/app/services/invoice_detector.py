import re
import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.vendor import TrustedVendor
from app.models.scan import ScanHistory
from app.models.invoice import Invoice
from app.models.vendor_history import VendorBankHistory

def mask_bank_account(account: str) -> str:
    """
    Mask bank account number for UI and logs (e.g., '987654321098' -> '•••• •••• 1098').
    """
    clean = account.strip().replace(" ", "").replace("-", "")
    if len(clean) <= 4:
        return "•••• " + clean
    visible = clean[-4:]
    return f"•••• •••• {visible}"

def normalize_invoice_number(inv_num: str) -> str:
    """
    Normalize invoice number for exact duplicate matching (e.g. 'INV-2024-88' -> 'inv202488').
    """
    return re.sub(r'[^a-zA-Z0-9]', '', inv_num).lower()

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
    normalized_inv_num = normalize_invoice_number(clean_invoice_num)
    clean_domain = vendor_domain.strip().lower()
    clean_account = bank_account.strip().replace(" ", "").replace("-", "")
    masked_account = mask_bank_account(clean_account)
    clean_ifsc = ifsc_code.strip().upper()

    # 1. Look up Vendor in Trusted Directory
    trusted_vendor = db.query(TrustedVendor).filter(
        (TrustedVendor.name.ilike(f"%{clean_vendor_name}%")) | 
        (TrustedVendor.domain.ilike(clean_domain))
    ).first()

    vendor_registered = False
    vendor_id = None
    
    if not trusted_vendor:
        score += 55
        reasons.append(f"[Vendor Audit] Vendor '{clean_vendor_name}' ({clean_domain}) is NOT found in your Trusted Vendor Directory.")
        recommendations.append("Perform an out-of-band verification (call vendor via official phone number) before registering new payment details.")
    else:
        vendor_registered = True
        vendor_id = trusted_vendor.id
        reasons.append(f"[Vendor Audit] Vendor '{trusted_vendor.name}' (ID #{vendor_id}) is registered in Trusted Vendor Directory (Status: {trusted_vendor.verification_status.upper()}).")

        # Invoice Reference Pattern Check
        if trusted_vendor.invoice_ref:
            if trusted_vendor.invoice_ref.lower() in clean_invoice_num.lower() or clean_invoice_num.lower() in trusted_vendor.invoice_ref.lower():
                reasons.append(f"[Vendor Audit] Invoice reference '{clean_invoice_num}' matches registered vendor reference pattern '{trusted_vendor.invoice_ref}'.")
            else:
                score += 15
                reasons.append(f"[Ref Mismatch] Invoice reference '{clean_invoice_num}' differs from registered vendor reference prefix '{trusted_vendor.invoice_ref}'.")

        # 2. Bank Account Change & Approval Audit Workflow Check
        trusted_acc_clean = trusted_vendor.bank_account.strip().replace(" ", "").replace("-", "")
        trusted_acc_masked = mask_bank_account(trusted_acc_clean)
        
        if clean_account != trusted_acc_clean:
            score += 60
            # Nuanced Risk Warning: Changed bank account triggers verification & approval workflow, not automatic conclusion of fraud
            reasons.append(
                f"[Bank Detail Mismatch & Change Audit] Submitted bank account '{masked_account}' differs from registered record '{trusted_acc_masked}'. "
                f"Triggers mandatory out-of-band verification & pending approval workflow."
            )
            recommendations.append(
                f"HOLD PAYMENT & INITIATE VERIFICATION: Submitted bank account ({masked_account}) does not match registered vendor record ({trusted_acc_masked}). "
                f"Contact vendor finance department via verified phone number before authorizing transfer."
            )
            
            # Check if there is an existing bank change history request
            history_record = db.query(VendorBankHistory).filter(
                VendorBankHistory.vendor_id == vendor_id,
                VendorBankHistory.new_bank_account_masked == masked_account
            ).first()
            if history_record:
                reasons.append(f"[Bank Change Audit] A bank detail change request is currently '{history_record.status.upper()}' (Requested by: {history_record.requested_by}).")
        else:
            reasons.append(f"[Vendor Audit] Bank account number ({masked_account}) matches verified registered records.")

        # 3. IFSC / Routing Code Mismatch Check
        trusted_ifsc_clean = trusted_vendor.ifsc_code.strip().upper()
        if clean_ifsc != trusted_ifsc_clean:
            score += 35
            reasons.append(f"[IFSC Mismatch] Submitted routing/IFSC code '{clean_ifsc}' differs from registered code '{trusted_vendor.ifsc_code}'.")
            recommendations.append("Verify bank branch routing details directly with vendor finance department.")
        else:
            reasons.append("[Vendor Audit] IFSC/Routing code matches registered records.")

        # 4. Vendor Domain Mismatch Check
        trusted_domain_clean = trusted_vendor.domain.strip().lower()
        if clean_domain != trusted_domain_clean:
            score += 35
            reasons.append(f"[Domain Check] Vendor email domain mismatch! Submitted: '{clean_domain}' vs Approved: '{trusted_domain_clean}'.")
            recommendations.append("Confirm email header sender origin matches official vendor domain.")

        # 5. Historical Invoice Amount Anomaly Detection (Statistical Mean & Std Dev)
        historical_invoices = db.query(Invoice).filter(Invoice.vendor_id == vendor_id).all()
        if len(historical_invoices) >= 2:
            amounts = [inv.amount for inv in historical_invoices if inv.amount > 0]
            if amounts:
                mean_amt = sum(amounts) / len(amounts)
                variance = sum((x - mean_amt) ** 2 for x in amounts) / len(amounts)
                std_dev = math.sqrt(variance)
                max_amt = max(amounts)
                
                if amount > (mean_amt + 2.0 * std_dev) or (max_amt > 0 and amount > 1.8 * max_amt):
                    score += 30
                    reasons.append(
                        f"[Amount Anomaly Detection] Submitted amount (${amount:,.2f}) is a statistical anomaly "
                        f"compared to historical vendor average (${mean_amt:,.2f} ± ${std_dev:,.2f}, Historical Max: ${max_amt:,.2f})."
                    )
                    recommendations.append("Require dual-signoff executive authorization for invoices exceeding routine historical vendor baselines.")
                else:
                    reasons.append(f"[Amount Baseline Audit] Invoice amount (${amount:,.2f}) is within historical vendor average (${mean_amt:,.2f}).")
        elif trusted_vendor.max_typical_amount and amount > trusted_vendor.max_typical_amount:
            score += 25
            reasons.append(f"[Amount Anomaly] Invoice amount (${amount:,.2f}) exceeds typical maximum threshold (${trusted_vendor.max_typical_amount:,.2f}) for this vendor.")
            recommendations.append("Require dual-signoff authorization for invoices exceeding operational thresholds.")

    # 6. Basic Input Validation Checks
    if amount <= 0:
        score += 30
        reasons.append("[Validation Error] Invoice amount must be greater than zero.")
        
    # 7. Exact Duplicate Check using Vendor ID and Normalized Invoice Number
    duplicate_query = db.query(Invoice).filter(Invoice.normalized_invoice_number == normalized_inv_num)
    if vendor_id:
        duplicate_query = duplicate_query.filter(Invoice.vendor_id == vendor_id)
        
    existing_duplicate = duplicate_query.first()

    if existing_duplicate:
        score += 45
        reasons.append(
            f"[CRITICAL DUPLICATE DETECTED] Exact duplicate invoice detected! "
            f"Normalized reference '{normalized_inv_num}' was previously recorded for Vendor ID #{existing_duplicate.vendor_id or 'N/A'} "
            f"(Invoice ID #{existing_duplicate.id}, Amount: ${existing_duplicate.amount:,.2f})."
        )
        recommendations.append("STOP PROCESSING: This exact invoice number has already been entered into your financial database.")

    # Risk Level Categorization
    final_score = min(100, score)
    if final_score >= 60:
        risk_level = "High"
    elif final_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    recommendations.append("Compliance Protocol: Bank detail changes trigger verification workflows; never update payment details based on unverified email requests.")

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
            "vendor_id": vendor_id,
            "invoice_number": clean_invoice_num,
            "normalized_invoice_number": normalized_inv_num,
            "vendor_domain": clean_domain,
            "bank_account_masked": masked_account,
            "ifsc_code_submitted": clean_ifsc,
            "amount": amount,
            "due_date": due_date,
            "vendor_registered": vendor_registered,
            "is_duplicate": existing_duplicate is not None,
            "assessment_classification": "Trusted Vendor Verification, Duplicate Checks & Anomaly Detection"
        }
    }
