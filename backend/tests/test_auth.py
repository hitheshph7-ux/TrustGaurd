import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_admin_register():
    random_email = f"director-{uuid.uuid4().hex[:6]}@company-sec.com"
    payload = {
        "full_name": "Security Director",
        "email": random_email,
        "password": "SecurePassword123!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == random_email

def test_admin_login():
    random_email = f"director-{uuid.uuid4().hex[:6]}@company-sec.com"
    payload = {
        "full_name": "Login Director",
        "email": random_email,
        "password": "SecurePassword123!"
    }
    reg_res = client.post("/api/auth/register", json=payload)
    assert reg_res.status_code == 201

    login_res = client.post("/api/auth/login", json={"email": random_email, "password": "SecurePassword123!"})
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
