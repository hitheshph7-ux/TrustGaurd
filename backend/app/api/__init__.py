from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.email import router as email_router
from app.api.url import router as url_router
from app.api.invoice import router as invoice_router
from app.api.scans import router as scans_router
from app.api.vendors import router as vendors_router
from app.api.dashboard import router as dashboard_router
from app.api.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(email_router)
api_router.include_router(url_router)
api_router.include_router(invoice_router)
api_router.include_router(scans_router)
api_router.include_router(vendors_router)
api_router.include_router(dashboard_router)
