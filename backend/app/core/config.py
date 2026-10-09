import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustGuard"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trustguard.db")
    
    # Security & CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    
    # Optional Threat Intelligence Provider Key
    VT_API_KEY: str = os.getenv("VT_API_KEY", "")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
