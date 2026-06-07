from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Bridgr API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bridgr"
    JWT_SECRET: str = "change-me-access-secret"
    JWT_REFRESH_SECRET: str = "change-me-refresh-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1
    FRONTEND_URL: str = "http://localhost:5173"
    VERCEL_FRONTEND_URL: str | None = None
    CORS_ORIGINS: str | list[str] = ""
    CORS_ORIGIN_REGEX: str | None = None
    SECURE_COOKIE_SECURE: bool | None = None
    SECURE_COOKIE_SAME_SITE: str | None = None

    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None
    ADMIN_NAME: str = "Admin User"

    # Cloudflare R2 / S3-compatible storage
    R2_ACCOUNT_ID: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET_NAME: str = "bridgr"
    R2_PUBLIC_BASE_URL: str | None = None
    R2_ENDPOINT_URL: str | None = None

    RESEND_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> str | list[str]:
        if isinstance(value, str) and value:
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator(
        "VERCEL_FRONTEND_URL",
        "CORS_ORIGIN_REGEX",
        "SECURE_COOKIE_SECURE",
        "SECURE_COOKIE_SAME_SITE",
        "ADMIN_EMAIL",
        "ADMIN_PASSWORD",
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_ENDPOINT_URL",
        "R2_PUBLIC_BASE_URL",
        "RESEND_API_KEY",
        mode="before",
    )
    @classmethod
    def empty_string_to_none(cls, value):
        return None if value == "" else value

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT.lower() in {"dev", "development", "local"}

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"prod", "production"}

    @property
    def cors_origins(self) -> list[str]:
        origins = ["http://localhost:5173", "http://localhost:3000", self.FRONTEND_URL]
        if isinstance(self.CORS_ORIGINS, list):
            origins.extend(self.CORS_ORIGINS)
        if self.VERCEL_FRONTEND_URL:
            origins.append(self._with_scheme(self.VERCEL_FRONTEND_URL))
        return sorted({origin.rstrip("/") for origin in origins if origin})

    @property
    def cors_origin_regex(self) -> str | None:
        if self.CORS_ORIGIN_REGEX:
            return self.CORS_ORIGIN_REGEX
        if self.is_production:
            return r"https://.*\.vercel\.app"
        return None

    @property
    def cookie_secure(self) -> bool:
        return self.SECURE_COOKIE_SECURE if self.SECURE_COOKIE_SECURE is not None else self.is_production

    @property
    def cookie_same_site(self) -> str:
        return self.SECURE_COOKIE_SAME_SITE or ("none" if self.is_production else "lax")

    @staticmethod
    def _with_scheme(origin: str) -> str:
        if origin.startswith(("http://", "https://")):
            return origin
        return f"https://{origin}"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
