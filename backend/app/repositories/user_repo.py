from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email (case-insensitive)."""
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_verification_token(self, token: str) -> User | None:
        """Get user by email verification token."""
        result = await self.db.execute(
            select(User).where(User.email_verification_token == token)
        )
        return result.scalar_one_or_none()

    async def get_by_reset_token(self, token: str) -> User | None:
        """Get user by password reset token."""
        result = await self.db.execute(
            select(User).where(User.password_reset_token == token)
        )
        return result.scalar_one_or_none()
