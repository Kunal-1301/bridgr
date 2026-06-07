"""Create admin user from environment variables.

Usage:
    python -m app.scripts.create_admin
"""

import asyncio
import sys
from os import getenv

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.db.enums import UserRole, UserStatus
from app.db.models.user import User


async def create_admin_user() -> None:
    admin_email = getenv("ADMIN_EMAIL")
    admin_password = getenv("ADMIN_PASSWORD")
    admin_name = getenv("ADMIN_NAME", "Admin User")

    if not admin_email or not admin_password:
        print("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required")
        sys.exit(1)

    if len(admin_password) < 8:
        print("Error: Password must be at least 8 characters long")
        sys.exit(1)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == admin_email.lower()))
        if result.scalar_one_or_none():
            print(f"Admin already exists: {admin_email}")
            await engine.dispose()
            return

        admin = User(
            email=admin_email.lower(),
            password_hash=hash_password(admin_password),
            full_name=admin_name,
            role=UserRole.admin,
            status=UserStatus.active,
            is_email_verified=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Admin created: {admin_email} (id={admin.id})")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin_user())
