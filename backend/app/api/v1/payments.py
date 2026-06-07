from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.db.models.user import UserRole

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.client, UserRole.admin))])


@router.post("/stripe/checkout")
async def create_checkout(payload: dict):
    return {"checkoutUrl": "#", **payload}


@router.post("/stripe/setup-intent")
async def create_setup_intent():
    return {"clientSecret": "setup_placeholder"}
