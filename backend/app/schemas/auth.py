from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

class AdminRegisterRequest(BaseModel):
    full_name: str = Field(..., description="Admin user full name")
    email: EmailStr = Field(..., description="Admin email address")
    password: str = Field(..., min_length=6, description="Password min 6 characters")

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
