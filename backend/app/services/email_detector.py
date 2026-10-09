import re
from typing import Dict, Any, List
from app.services.ml_classifier import phishing_ml_classifier

# Phishing Heuristic Patterns
URGENCY_PATTERNS = [
    r"\b(urgent|immediately|action required|account suspended|24 hours|within 48 hours|terminate|locked|verify now|immediate action|critical alert)\b",
    r"\b(final notice|last chance|failure to comply|legal action|police|lawsuit|penalty)\b"
]

CREDENTIAL_PATTERNS = [
    r"\b(password|credentials|login|social security|ssn|verification code|pin|secret|passcode|re-enter your|confirm your password)\b",
    r"\b(update your security|reset password|verify account details)\b"
]

PAYMENT_PATTERNS = [
    r"\b(wire transfer|gift card|crypto|bitcoin|payroll|bank details|new bank account|update payment info|remittance|invoice paid|urgent payment)\b",
    r"\$(\d{1,3}(,\d{3})*|\d+)(\.\d{2})?"
]

SUSPICIOUS_DOMAIN_PATTERNS = [
    r"\.(xyz|top|work|click|country|gq|cf|ml|tk|buzz|cam|monster|rest|online|site)$",
    r"(security|verify|update|support|admin|login|auth|service)-[a-z0-9-]+\.",
    r"paypal|microsoft|google|apple|amazon|netflix|bankofamerica|chase|wellsfargo"
]

# Commercial Spam Heuristic Patterns
SPAM_PROMOTIONAL_PATTERNS = [
    r"\b(congratulations|you won|claim your reward|free prize|grand prize|lottery winner|80% off|unbeatable deal|exclusive discount|limited time offer)\b",
    r"\b(earn \$|work from home|instant cash|no experience needed|casino|free spins|cheap pharmacy|weight loss|miracle pill|100% free|buy now)\b",
    r"\b(click here now|act now|don't miss out|cash payout|guaranteed income|free trial|special promotion)\b"
]

def analyze_email(subject: str, sender: str, body: str) -> Dict[str, Any]:
    combined_text = f"{subject}\n{body}".lower()
    sender_lower = sender.lower()
    
    reasons: List[str] = []
    recommendations: List[str] = []
    
    phishing_score = 0
    spam_score = 0
    
    # 1. Phishing: Urgency & Pressure
    urgency_matches = []
    for pattern in URGENCY_PATTERNS:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        if matches:
            urgency_matches.extend([m if isinstance(m, str) else m[0] for m in matches])
            
    if urgency_matches:
        phishing_score += 25
        unique_urgency = list(set(urgency_matches))[:3]
        reasons.append(f"[Phishing Heuristic] High urgency & psychological pressure detected (keywords: {', '.join(unique_urgency)})")
        recommendations.append("Do not succumb to pressure or artificial urgency. Verify out-of-band before taking action.")

    # 2. Phishing: Credential Harvesting Requests
    cred_matches = []
    for pattern in CREDENTIAL_PATTERNS:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        if matches:
            cred_matches.extend([m if isinstance(m, str) else m[0] for m in matches])
            
    if cred_matches:
        phishing_score += 30
        reasons.append("[Phishing Heuristic] Password or credential update request identified in email text.")
        recommendations.append("Never enter passwords or credentials from email links. Navigate directly to official login portals.")

    # 3. Phishing: Suspicious Financial / Payment Request
    payment_matches = []
    for pattern in PAYMENT_PATTERNS:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        if matches:
            payment_matches.extend([m if isinstance(m, str) else m[0] for m in matches])
            
    if payment_matches:
        phishing_score += 20
        reasons.append("[Phishing Heuristic] Suspicious payment or bank detail change request detected.")

    # 4. Phishing: Misleading Sender & Display Name Spoofing
    sender_domain = ""
    if "@" in sender_lower:
        sender_domain = sender_lower.split("@")[-1].strip(">").strip()
        
    for pattern in SUSPICIOUS_DOMAIN_PATTERNS:
        if sender_domain and re.search(pattern, sender_domain):
            phishing_score += 25
            reasons.append(f"[Phishing Heuristic] Sender domain '{sender_domain}' matches known suspicious pattern or lookalike indicator.")
            break

    if "<" in sender:
        display_name = sender.split("<")[0].lower()
        if any(brand in display_name for brand in ["google", "microsoft", "paypal", "apple", "amazon", "bank"]):
            if sender_domain and not any(brand in sender_domain for brand in ["google.com", "microsoft.com", "paypal.com", "apple.com", "amazon.com"]):
                phishing_score += 30
                reasons.append(f"[Phishing Heuristic] Display name spoofing suspected: Display name claims brand authority but sender domain is '{sender_domain}'.")

    # 5. Spam Heuristic Detection: Promotional Hype & Scams
    spam_matches = []
    for pattern in SPAM_PROMOTIONAL_PATTERNS:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        if matches:
            spam_matches.extend([m if isinstance(m, str) else m[0] for m in matches])

    if spam_matches:
        spam_score += 35
        unique_spam = list(set(spam_matches))[:4]
        reasons.append(f"[Spam Heuristic] Unsolicited promotional spam keywords identified (keywords: {', '.join(unique_spam)})")
        recommendations.append("Mark unsolicited commercial bulk messages as SPAM or block sender domain.")

    # Excessive CAPS check in Subject
    if subject and len(subject) > 10:
        uppercase_ratio = sum(1 for c in subject if c.isupper()) / len(subject)
        if uppercase_ratio > 0.65:
            spam_score += 25
            reasons.append(f"[Spam Heuristic] Excessive ALL-CAPS subject line hype detected ({int(uppercase_ratio * 100)}% uppercase).")

    # Excessive Exclamation Marks
    exclamation_count = combined_text.count("!") + combined_text.count("$$")
    if exclamation_count >= 3:
        spam_score += 20
        reasons.append(f"[Spam Heuristic] Excessive promotional punctuation or financial hype symbols ({exclamation_count} occurrences).")

    # 6. ML Multi-Class Classifier Prediction
    ml_result = phishing_ml_classifier.predict(combined_text)
    ml_phishing_pct = ml_result["phishing_score_pct"]
    ml_spam_pct = ml_result["spam_score_pct"]
    ml_category = ml_result["ml_category"]

    if ml_phishing_pct > 55:
        reasons.append(f"[ML Model] Classifier assigned {ml_phishing_pct}% probability of phishing (features: {', '.join(ml_result['contributing_features'])})")
    elif ml_spam_pct > 45:
        reasons.append(f"[ML Model] Classifier assigned {ml_spam_pct}% probability of unsolicited commercial spam (features: {', '.join(ml_result['contributing_features'])})")
    elif ml_phishing_pct < 25 and ml_spam_pct < 25 and phishing_score == 0 and spam_score == 0:
        reasons.append(f"[ML Model] Classifier evaluated email text as clean legitimate correspondence.")

    # Composite Risk & Category Calculation
    final_phishing_score = int(round(min(100, (phishing_score * 0.6) + (ml_phishing_pct * 0.4))))
    final_spam_score = int(round(min(100, (spam_score * 0.6) + (ml_spam_pct * 0.4))))

    # Category Determination
    if final_phishing_score >= 50 or (phishing_score >= 40 and final_phishing_score >= 40):
        email_category = "Phishing Alert"
        composite_risk_score = max(final_phishing_score, 65)
        risk_level = "High"
    elif final_spam_score >= 40 or ml_category == "Spam":
        email_category = "Spam / Unsolicited Bulk"
        composite_risk_score = max(final_spam_score, 45)
        risk_level = "Medium" if composite_risk_score >= 45 else "Low"
    else:
        email_category = "Clean / Legitimate"
        composite_risk_score = min(final_phishing_score, final_spam_score)
        risk_level = "Low"

    if not reasons:
        reasons.append("[Analysis] No phishing or promotional spam signatures identified in email payload.")

    if not recommendations:
        recommendations.append("Standard business message. Maintain routine security vigilance.")

    target_identifier = subject if subject.strip() else f"Email from {sender}"

    return {
        "scan_type": "email",
        "target_identifier": target_identifier,
        "risk_level": risk_level,
        "risk_score": composite_risk_score,
        "reasons": reasons,
        "recommendations": recommendations,
        "details": {
            "subject": subject,
            "sender": sender,
            "sender_domain": sender_domain,
            "email_category": email_category,
            "phishing_risk_score": final_phishing_score,
            "spam_probability_score": final_spam_score,
            "ml_analysis": ml_result,
            "assessment_classification": f"Email Analysis: {email_category} (Phishing: {final_phishing_score}%, Spam: {final_spam_score}%)"
        }
    }
