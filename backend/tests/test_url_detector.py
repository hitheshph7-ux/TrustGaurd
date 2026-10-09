from app.services.url_detector import analyze_url

def test_malicious_lookalike_url():
    url = "http://paypa1.com.secure-auth-login.xyz/signin"
    res = analyze_url(url)
    assert res["risk_level"] in ["High", "Medium"]
    assert res["risk_score"] > 40
    assert any("http" in r.lower() or "lookalike" in r.lower() or "xyz" in r.lower() for r in res["reasons"])

def test_ip_based_url():
    url = "http://192.168.1.1/admin"
    res = analyze_url(url)
    assert res["risk_level"] in ["High", "Medium"]
    assert any("ip address" in r.lower() for r in res["reasons"])

def test_safe_url():
    url = "https://github.com/fastapi/fastapi"
    res = analyze_url(url)
    assert res["risk_level"] == "Low"
    assert res["risk_score"] < 30
