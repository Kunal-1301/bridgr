from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_token(subject: str, secret: str, expires_delta: timedelta, claims: dict[str, Any] | None = None) -> str:
    expire = datetime.now(UTC) + expires_delta
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    return create_token(
        subject=subject,
        secret=settings.JWT_SECRET,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        claims=claims,
    )


def create_refresh_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    return create_token(
        subject=subject,
        secret=settings.JWT_REFRESH_SECRET,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        claims=claims,
    )


def create_email_verification_token(user_id: str) -> str:
    """Create email verification token with 24-hour expiry."""
    return create_token(
        subject=user_id,
        secret=settings.JWT_SECRET,
        expires_delta=timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS),
        claims={"type": "email_verification"},
    )


def create_password_reset_token(user_id: str) -> str:
    """Create password reset token with 1-hour expiry."""
    return create_token(
        subject=user_id,
        secret=settings.JWT_SECRET,
        expires_delta=timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS),
        claims={"type": "password_reset"},
    )


def decode_token(token: str, secret: str = settings.JWT_SECRET) -> dict[str, Any]:
    try:
        return jwt.decode(token, secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode refresh token using refresh secret."""
    try:
        return jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid refresh token") from exc
