from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.db.models.user import UserRole

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.client, UserRole.admin))])


@router.get("")
async def get_notifications():
    return []
