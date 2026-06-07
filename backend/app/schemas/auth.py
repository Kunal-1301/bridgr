from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserOut


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    portal: str | None = None  # worker, client, admin — used for role enforcement
    role: str | None = None    # frontend compat alias; portal takes precedence


class TokenPair(BaseModel):
    accessToken: str
    user: UserOut


class RefreshIn(BaseModel):
    refreshToken: str


class RefreshOut(BaseModel):
    accessToken: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ForgotPasswordOut(BaseModel):
    message: str


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


class ResetPasswordOut(BaseModel):
    message: str


class VerifyEmailIn(BaseModel):
    token: str


class VerifyEmailOut(BaseModel):
    message: str


class RegisterWorkerIn(BaseModel):
    fullName: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str = Field(min_length=7, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    dateOfBirth: str | None = None
    bio: str | None = Field(default=None, max_length=1000)
    skills: list[str] = Field(default_factory=list)
    experienceLevel: str | None = None
    rateMin: float = Field(default=0, ge=0)
    rateMax: float = Field(default=0, ge=0)


class RegisterWorkerOut(BaseModel):
    message: str
    userId: str
