from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.api.deps import CurrentUser, DbSession, RequireAdmin
from app.core.config import settings
from app.schemas.auth import (
    ForgotPasswordIn,
    ForgotPasswordOut,
    LoginIn,
    RefreshIn,
    RefreshOut,
    RegisterWorkerIn,
    RegisterWorkerOut,
    ResetPasswordIn,
    ResetPasswordOut,
    VerifyEmailOut,
)
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

router = APIRouter()


def _client_ip(request: Request) -> str:
    if x_forwarded_for := request.headers.get("x-forwarded-for"):
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else ""


def _set_refresh_cookie(response: JSONResponse, token: str) -> JSONResponse:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=settings.REFRESH_COOKIE_DOMAIN,
    )
    return response


def _user_dict(user) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "fullName": user.full_name,
        "isEmailVerified": user.is_email_verified,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/login")
async def login(payload: LoginIn, request: Request, db: DbSession):
    user, access_token, refresh_token = await AuthService(db).login(payload, _client_ip(request))
    response = JSONResponse(
        content={"accessToken": access_token, "user": _user_dict(user)},
        status_code=200,
    )
    return _set_refresh_cookie(response, refresh_token)


@router.post("/refresh", response_model=RefreshOut)
async def refresh(payload: RefreshIn, request: Request, db: DbSession) -> RefreshOut:
    return await AuthService(db).refresh(payload.refreshToken, _client_ip(request))


@router.post("/logout")
async def logout(user: CurrentUser, request: Request, db: DbSession) -> dict:
    await AuthService(db).logout(user.id, _client_ip(request))
    response = JSONResponse(content={"message": "Logged out successfully"}, status_code=200)
    response.delete_cookie(
        "refresh_token",
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        domain=settings.REFRESH_COOKIE_DOMAIN,
    )
    return response


@router.get("/me")
async def me(user: CurrentUser) -> dict:
    return _user_dict(user)


@router.post("/register-worker", response_model=RegisterWorkerOut)
@router.post("/register/worker", response_model=RegisterWorkerOut, include_in_schema=False)
async def register_worker(payload: RegisterWorkerIn, request: Request, db: DbSession) -> RegisterWorkerOut:
    return await AuthService(db).register_worker(payload, _client_ip(request))


@router.post("/forgot-password", response_model=ForgotPasswordOut)
async def forgot_password(payload: ForgotPasswordIn, request: Request, db: DbSession) -> ForgotPasswordOut:
    return await AuthService(db).forgot_password(payload.email, _client_ip(request))


@router.post("/reset-password", response_model=ResetPasswordOut)
async def reset_password(payload: ResetPasswordIn, request: Request, db: DbSession) -> ResetPasswordOut:
    return await AuthService(db).reset_password(payload.token, payload.password, _client_ip(request))


@router.post("/verify-email/{token}", response_model=VerifyEmailOut)
async def verify_email(token: str, request: Request, db: DbSession) -> VerifyEmailOut:
    return await AuthService(db).verify_email(token, _client_ip(request))


@router.post("/admin/create", response_model=dict)
async def create_admin(admin_user: RequireAdmin, payload: dict, db: DbSession) -> dict:
    from app.core.security import hash_password
    from app.db.models.user import User, UserRole
    from app.repositories.user_repo import UserRepository

    email = payload.get("email", "").lower()
    password = payload.get("password", "")
    full_name = payload.get("fullName", "")

    if not email or not password or len(password) < 8:
        raise ValueError("Invalid email or password")

    users = UserRepository(db)
    if await users.get_by_email(email):
        raise ValueError("Email already registered")

    new_admin = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.admin,
        is_email_verified=True,
    )
    await users.add(new_admin)
    await db.commit()

    return {"message": "Admin created successfully", "userId": str(new_admin.id)}
