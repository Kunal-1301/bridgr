from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.db.models.user import UserRole

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.client, UserRole.admin))])


@router.post("/razorpay/order")
async def create_razorpay_order(payload: dict):
    return {"provider": "razorpay", "status": "pending_configuration", **payload}


@router.post("/razorpay/payout-record")
async def record_razorpay_payout(payload: dict):
    return {"provider": "razorpay", "status": "recorded", **payload}


@router.post("/stripe/checkout")
async def create_checkout(payload: dict):
    return {"provider": "stripe", "checkoutUrl": "#", **payload}


@router.post("/stripe/setup-intent")
async def create_setup_intent():
    return {"provider": "stripe", "clientSecret": "setup_placeholder"}
