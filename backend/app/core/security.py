import hashlib
import os
import secrets
import time
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "trustguard-super-secret-jwt-key-2026")

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = "tg_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(user_email: str) -> str:
    """Create a bearer session token."""
    timestamp = int(time.time())
    token_raw = f"{user_email}:{timestamp}:{SECRET_KEY}"
    token_hash = hashlib.sha256(token_raw.encode('utf-8')).hexdigest()
    return f"tg_token_{token_hash[:32]}"
