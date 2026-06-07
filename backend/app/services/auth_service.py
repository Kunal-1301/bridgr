from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.enums import ExperienceLevel, UserStatus, VerificationStatus
from app.db.models.user import User, UserRole
from app.db.models.worker import WorkerProfile
from app.repositories.user_repo import UserRepository
from app.repositories.worker_repo import WorkerRepository
from app.schemas.auth import (
    ForgotPasswordOut,
    LoginIn,
    RefreshOut,
    RegisterWorkerIn,
    RegisterWorkerOut,
    ResetPasswordOut,
    TokenPair,
    VerifyEmailOut,
)
from app.schemas.user import UserOut
from app.services.audit_service import AuditService

_BLOCKED_STATUSES = {UserStatus.suspended, UserStatus.deleted}


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.workers = WorkerRepository(db)
        self.audit = AuditService(db)

    async def login(self, payload: LoginIn, ip_address: str | None = None) -> tuple[User, str, str]:
        email = payload.email.lower()

        user = await self.users.get_by_email(email)
        if not user or not verify_password(payload.password, user.password_hash):
            await self.audit.log_login_failure(email, ip_address)
            raise AppError("Invalid email or password", status_code=401, code="invalid_credentials")

        if user.status in _BLOCKED_STATUSES:
            raise AppError("Account is suspended or has been removed", status_code=403, code="inactive_account")

        if payload.portal and user.role.value != payload.portal:
            raise AppError(f"This account is not a {payload.portal}", status_code=403, code="wrong_role")

        await self.audit.log_login_success(user.id, ip_address)
        await self.db.commit()

        claims = {"role": user.role.value}
        access_token = create_access_token(str(user.id), claims)
        refresh_token = create_refresh_token(str(user.id), claims)

        return user, access_token, refresh_token

    async def refresh(self, refresh_token: str, ip_address: str | None = None) -> RefreshOut:
        try:
            from app.core.security import decode_refresh_token
            payload = decode_refresh_token(refresh_token)
        except ValueError:
            await self.audit.log_token_refresh_failure(ip_address)
            await self.db.commit()
            raise AppError("Invalid refresh token", status_code=401, code="invalid_refresh_token")

        user_id = payload.get("sub")
        if not user_id:
            await self.audit.log_token_refresh_failure(ip_address)
            await self.db.commit()
            raise AppError("Invalid refresh token", status_code=401, code="invalid_refresh_token")

        user = await self.users.get(UUID(user_id))
        if not user or user.status in _BLOCKED_STATUSES:
            await self.audit.log_token_refresh_failure(ip_address)
            await self.db.commit()
            raise AppError("User not found or inactive", status_code=401, code="user_not_found")

        access_token = create_access_token(str(user.id), claims={"role": user.role.value})
        return RefreshOut(accessToken=access_token)

    async def logout(self, user_id: UUID, ip_address: str | None = None) -> dict:
        await self.audit.log_logout(user_id, ip_address)
        await self.db.commit()
        return {"message": "Logged out successfully"}

    async def register_worker(self, payload: RegisterWorkerIn, ip_address: str | None = None) -> RegisterWorkerOut:
        email = payload.email.lower()

        existing = await self.users.get_by_email(email)
        if existing:
            raise AppError("Email is already registered", status_code=409, code="email_exists")

        user = User(
            email=email,
            password_hash=hash_password(payload.password),
            full_name=payload.fullName,
            phone=payload.phone,
            role=UserRole.worker,
        )
        await self.users.add(user)
        await self.db.flush()

        # Set email verification token now that we have user.id
        user.email_verification_token = create_email_verification_token(str(user.id))

        exp_level: ExperienceLevel | None = None
        if payload.experienceLevel:
            try:
                exp_level = ExperienceLevel(payload.experienceLevel.lower())
            except ValueError:
                exp_level = None

        worker_profile = WorkerProfile(
            user_id=user.id,
            city=payload.city,
            bio=payload.bio,
            skills=payload.skills or [],
            experience_level=exp_level,
            hourly_rate_min_inr=int(payload.rateMin) if payload.rateMin else None,
            hourly_rate_max_inr=int(payload.rateMax) if payload.rateMax else None,
            verification_status=VerificationStatus.draft,
        )
        await self.workers.add(worker_profile)

        await self.audit.log_worker_registration(user.id, email, ip_address)
        await self.db.commit()

        return RegisterWorkerOut(
            message="Registration successful. You can now log in.",
            userId=str(user.id),
        )

    async def verify_email(self, token: str, ip_address: str | None = None) -> VerifyEmailOut:
        try:
            payload = decode_token(token)
        except ValueError:
            raise AppError("Invalid or expired verification token", status_code=401, code="invalid_token")

        if payload.get("type") != "email_verification":
            raise AppError("Invalid token type", status_code=401, code="invalid_token")

        user = await self.users.get_by_verification_token(token)
        if not user:
            raise AppError("Invalid or expired verification token", status_code=401, code="invalid_token")

        user.is_email_verified = True
        user.email_verified_at = datetime.now(UTC)
        user.email_verification_token = None

        await self.db.commit()
        await self.audit.log_email_verification(user.id, ip_address)

        return VerifyEmailOut(message="Email verified successfully")

    async def forgot_password(self, email: str, ip_address: str | None = None) -> ForgotPasswordOut:
        email = email.lower()
        user = await self.users.get_by_email(email)

        if not user:
            return ForgotPasswordOut(message="If email exists, password reset link has been sent")

        reset_token = create_password_reset_token(str(user.id))
        user.password_reset_token = reset_token
        await self.db.commit()

        await self.audit.log_password_reset_request(user.id, ip_address)

        return ForgotPasswordOut(
            message=f"Password reset link has been sent to {email}. Use this token: {reset_token}"
        )

    async def reset_password(self, token: str, new_password: str, ip_address: str | None = None) -> ResetPasswordOut:
        try:
            payload = decode_token(token)
        except ValueError:
            raise AppError("Invalid or expired reset token", status_code=401, code="invalid_token")

        if payload.get("type") != "password_reset":
            raise AppError("Invalid token type", status_code=401, code="invalid_token")

        user_id = payload.get("sub")
        if not user_id:
            raise AppError("Invalid token", status_code=401, code="invalid_token")

        user = await self.users.get(UUID(user_id))
        if not user:
            raise AppError("User not found", status_code=401, code="user_not_found")

        user.password_hash = hash_password(new_password)
        user.password_reset_token = None
        await self.db.commit()

        await self.audit.log_password_reset_success(user.id, ip_address)

        return ResetPasswordOut(message="Password has been reset successfully")

    async def get_me(self, user: User) -> UserOut:
        return UserOut(
            id=user.id,
            email=user.email,
            role=user.role.value,
            fullName=user.full_name,
            isEmailVerified=user.is_email_verified,
            createdAt=user.created_at,
        )
