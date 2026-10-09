import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure app in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "TrustGuard" in data["service"]

def test_email_scan_api():
    payload = {
        "subject": "Urgent Password Update",
        "sender": "Admin <admin@login-secure-auth.xyz>",
        "body": "Your account password has expired. Click here to reset your password immediately."
    }
    response = client.post("/api/scans/email", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["scan_type"] == "email"
    assert "risk_level" in data
    assert "risk_score" in data

def test_url_scan_api():
    payload = {
        "url": "http://192.168.1.50/login.php"
    }
    response = client.post("/api/scans/url", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["scan_type"] == "url"
    assert data["risk_score"] > 30

def test_dashboard_stats_api():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_scans" in data
    assert "high_risk_count" in data
    assert "type_counts" in data

def test_vendors_crud_api():
    # 1. Create vendor
    vendor_payload = {
        "name": "Test Vendor LLC",
        "domain": "testvendor-example.com",
        "invoice_ref": "INV-2024-TEST",
        "bank_account": "1234998877",
        "ifsc_code": "TEST0001234",
        "approved_by": "Test Suite"
    }
    create_res = client.post("/api/vendors", json=vendor_payload)
    assert create_res.status_code == 201
    vendor_data = create_res.json()
    assert vendor_data["invoice_ref"] == "INV-2024-TEST"
    vendor_id = vendor_data["id"]

    # 2. Get vendors list
    get_res = client.get("/api/vendors")
    assert get_res.status_code == 200
    vendors_list = get_res.json()
    assert any(v["id"] == vendor_id for v in vendors_list)

    # 3. Delete vendor
    del_res = client.delete(f"/api/vendors/{vendor_id}")
    assert del_res.status_code == 204
