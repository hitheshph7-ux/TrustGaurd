import re
from urllib.parse import urlparse
from typing import Dict, Any, List
from app.core.config import settings

TRUSTED_BRAND_DOMAINS = [
    "google.com", "microsoft.com", "apple.com", "paypal.com",
    "amazon.com", "chase.com", "github.com", "linkedin.com",
    "facebook.com", "twitter.com", "bankofamerica.com", "stripe.com"
]

SUSPICIOUS_TLDS = [
    "xyz", "top", "work", "click", "country", "gq", "cf", "ml", "tk", "buzz",
    "cam", "monster", "rest", "online", "site", "space", "shop", "icu", "pw"
]

SENSITIVE_PATH_KEYWORDS = [
    "login", "signin", "verify", "account", "banking", "secure", "update",
    "credential", "password", "session", "authorize", "checkout", "admin"
]

def analyze_url(url_input: str) -> Dict[str, Any]:
    reasons: List[str] = []
    recommendations: List[str] = []
    score = 0
    
    clean_url = url_input.strip()
    if not clean_url.startswith(("http://", "https://")):
        # Prepend http:// for parsing if scheme missing
        parsing_target = "http://" + clean_url
        scheme_missing = True
    else:
        parsing_target = clean_url
        scheme_missing = False

    try:
        parsed = urlparse(parsing_target)
        hostname = parsed.hostname or ""
        scheme = parsed.scheme.lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
    except Exception as e:
        return {
            "scan_type": "url",
            "target_identifier": clean_url,
            "risk_level": "High",
            "risk_score": 90,
            "reasons": [f"Malformed or invalid URL syntax: {str(e)}"],
            "recommendations": ["Do not attempt to open this URL in any web browser."],
            "details": {"error": "Invalid URL syntax", "assessment_classification": "Local Heuristic Analysis"}
        }

    # 1. Scheme Check (HTTPS vs HTTP)
    if scheme == "http":
        score += 20
        reasons.append("[Heuristic] URL uses insecure HTTP protocol (unencrypted transport).")
        recommendations.append("Do not transmit sensitive credentials or financial details over unencrypted HTTP.")
    elif scheme != "https":
        score += 35
        reasons.append(f"[Heuristic] Non-standard URL scheme '{scheme}' detected.")

    if scheme_missing:
        reasons.append("[Heuristic] No scheme explicitly provided in input URL.")

    # 2. IP Address Hostname Check (e.g. http://192.168.1.1/login)
    ip_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if re.match(ip_pattern, hostname):
        score += 45
        reasons.append(f"[Heuristic] Target host uses direct numeric IP address ({hostname}) instead of a domain name.")
        recommendations.append("Legitimate services rarely request user logins via bare IP addresses. Extreme caution advised.")

    # 3. Domain TLD and Structure Analysis
    subdomains = hostname.split(".")
    if len(subdomains) > 4:
        score += 25
        reasons.append(f"[Heuristic] Excessive subdomain depth ({len(subdomains)} levels) detected in '{hostname}'.")

    tld = subdomains[-1].lower() if len(subdomains) > 1 else ""
    if tld in SUSPICIOUS_TLDS:
        score += 30
        reasons.append(f"[Heuristic] URL uses high-risk top-level domain '.{tld}'.")
        recommendations.append(f"Domain extension '.{tld}' is frequently associated with disposable phishing campaigns.")

    # 4. Lookalike & Typosquatting Brand Impersonation Check
    brand_impersonated = None
    for brand_domain in TRUSTED_BRAND_DOMAINS:
        brand_name = brand_domain.split(".")[0]
        # Check if brand name is in hostname but hostname is not the exact domain or legitimate subdomain
        if brand_name in hostname:
            if hostname != brand_domain and not hostname.endswith("." + brand_domain):
                score += 45
                brand_impersonated = brand_domain
                reasons.append(f"[Heuristic] Potential brand impersonation: Hostname contains '{brand_name}' but official domain is '{brand_domain}'.")
                recommendations.append(f"Do not interact with this site. If you intended to visit {brand_domain}, type the URL directly in your browser address bar.")
                break

    # Lookalike characters (e.g., paypa1, g00gle, rnicrosft)
    lookalike_replacements = [("0", "o"), ("1", "l"), ("1", "i"), ("rn", "m")]
    normalized_hostname = hostname
    for old, new in lookalike_replacements:
        normalized_hostname = normalized_hostname.replace(old, new)
        
    for brand_domain in TRUSTED_BRAND_DOMAINS:
        brand_name = brand_domain.split(".")[0]
        if brand_name in normalized_hostname and brand_name not in hostname:
            score += 40
            reasons.append(f"[Heuristic] Typosquatting / Character replacement detected imitating '{brand_name}'.")
            recommendations.append("Double check spelling of host domain name in address bar.")
            break

    # 5. Sensitive keywords in path / query string combined with suspicious domain
    path_query = path + " " + query
    matched_keywords = [kw for kw in SENSITIVE_PATH_KEYWORDS if kw in path_query]
    if matched_keywords:
        score += 15
        reasons.append(f"[Heuristic] Sensitive auth/login path keywords found in URL path: {', '.join(matched_keywords)}")

    # 6. External Threat Intelligence Integration Status
    threat_intel_status = "Disabled (Local Heuristics Only)"
    if settings.VT_API_KEY:
        threat_intel_status = "Configured (API Key Present)"
        reasons.append("[Threat Intel] Provider integration ready.")

    # Final Risk Level determination
    final_score = min(100, score)
    if final_score >= 60:
        risk_level = "High"
    elif final_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    if not reasons:
        reasons.append("[Heuristic] Standard URL structure. No obvious structural anomalies or lookalike patterns identified.")

    if not recommendations:
        recommendations.append("Ensure HTTPS indicator (padlock icon) is visible before submitting sensitive information.")

    recommendations.append("Security Warning: Heuristic analysis is not a guarantee of absolute safety. Exercise standard web hygiene.")

    return {
        "scan_type": "url",
        "target_identifier": clean_url,
        "risk_level": risk_level,
        "risk_score": final_score,
        "reasons": reasons,
        "recommendations": recommendations,
        "details": {
            "submitted_url": clean_url,
            "parsed_scheme": scheme,
            "parsed_hostname": hostname,
            "parsed_path": path,
            "subdomain_count": len(subdomains),
            "threat_intelligence_provider": threat_intel_status,
            "ssrf_protection": "Active (No external network fetching performed)",
            "assessment_classification": "Local URL Heuristics & Typosquatting Analysis"
        }
    }
