from fastapi import APIRouter

from app.api.v1 import admin, auth, client, payments, uploads, worker

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(worker.router, prefix="/worker", tags=["worker"])
api_router.include_router(client.router, prefix="/client", tags=["client"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
