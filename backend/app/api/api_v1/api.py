from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, properties, applications, tenants, payments, upload

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(upload.router, prefix="/upload", tags=["file-upload"])
