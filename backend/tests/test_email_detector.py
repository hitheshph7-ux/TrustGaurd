from app.services.email_detector import analyze_email

def test_phishing_email_detection():
    subject = "URGENT: Verify your account credentials within 24 hours!"
    sender = "PayPal Alert <security@paypal-verify-login.xyz>"
    body = "Dear customer, your account is suspended. Re-enter your password immediately at http://192.168.1.1/login."
    
    res = analyze_email(subject, sender, body)
    assert res["risk_level"] in ["High", "Medium"]
    assert res["risk_score"] > 50
    assert res["details"]["email_category"] == "Phishing Alert"

def test_spam_email_detection():
    subject = "CONGRATULATIONS! YOU WON A $1,000 GIFT CARD!!!"
    sender = "Promotions <deals@unbeatable-discount-offers.com>"
    body = "You have been selected for an exclusive VIP reward! Claim your free gift card now and get 80% off brand items today only!"

    res = analyze_email(subject, sender, body)
    assert res["details"]["email_category"] == "Spam / Unsolicited Bulk"
    assert res["details"]["spam_probability_score"] >= 40
    assert any("spam" in r.lower() for r in res["reasons"])

def test_legitimate_email_detection():
    subject = "Weekly Team Sync Notes"
    sender = "Alex <alex@acme.com>"
    body = "Hi team, thanks for joining today's call. Here are the action items for next week."
    
    res = analyze_email(subject, sender, body)
    assert res["risk_level"] == "Low"
    assert res["risk_score"] < 35
    assert res["details"]["email_category"] == "Clean / Legitimate"
