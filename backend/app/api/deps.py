from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_token
from app.db.enums import UserStatus
from app.db.models.user import User, UserRole
from app.db.session import get_db
from app.repositories.user_repo import UserRepository

_BLOCKED_STATUSES = {UserStatus.suspended, UserStatus.deleted}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DbSession) -> User:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise AppError("Invalid authentication token", status_code=401, code="invalid_token") from exc
    user_id = payload.get("sub")
    if not user_id:
        raise AppError("Invalid authentication token", status_code=401, code="invalid_token")
    try:
        user_uuid = UUID(str(user_id))
    except ValueError as exc:
        raise AppError("Invalid authentication token", status_code=401, code="invalid_token") from exc
    user = await UserRepository(db).get(user_uuid)
    if not user or user.status in _BLOCKED_STATUSES:
        raise AppError("User not found or inactive", status_code=401, code="user_not_found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_ip(request: Request | None) -> str | None:
    if not request:
        return None
    if fwd := request.headers.get("x-forwarded-for"):
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.admin:
        raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
    return user


def require_worker(user: CurrentUser) -> User:
    if user.role != UserRole.worker:
        raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
    return user


def require_client(user: CurrentUser) -> User:
    if user.role != UserRole.client:
        raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
    return user


def require_affiliate(user: CurrentUser) -> User:
    """Dependency to require affiliate role."""
    if user.role != UserRole.affiliate:
        raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
    return user


def require_roles(*roles: UserRole):
    """Create a dependency to require one of multiple roles."""
    async def dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
        return user

    return dependency


RequireAdmin = Annotated[User, Depends(require_admin)]
RequireWorker = Annotated[User, Depends(require_worker)]
RequireClient = Annotated[User, Depends(require_client)]
RequireAffiliate = Annotated[User, Depends(require_affiliate)]
