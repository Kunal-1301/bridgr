"""Seed database with initial admin user and reference data.

Usage:
    python -m app.scripts.seed

Environment variables:
    ADMIN_EMAIL     — admin account email (required)
    ADMIN_PASSWORD  — admin account password (required, min 8 chars)
    ADMIN_NAME      — admin display name (default: Admin User)
"""

import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.db.enums import UserRole, UserStatus
from app.db.models.skill import Skill
from app.db.models.user import User

SEED_SKILLS = [
    "Python",
    "React",
    "FastAPI",
    "PostgreSQL",
    "UI Design",
    "Graphic Design",
    "Video Editing",
    "Content Writing",
    "SEO",
    "Virtual Assistant",
    "Data Entry",
    "WordPress",
]


async def seed_admin(session: AsyncSession) -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Admin User")

    if not admin_email or not admin_password:
        print("  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation")
        return

    result = await session.execute(select(User).where(User.email == admin_email.lower()))
    if result.scalar_one_or_none():
        print(f"  Admin already exists: {admin_email}")
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
    await session.flush()
    print(f"  Created admin: {admin_email} (id={admin.id})")


async def seed_skills(session: AsyncSession) -> None:
    created = 0
    for skill_name in SEED_SKILLS:
        result = await session.execute(select(Skill).where(Skill.name == skill_name))
        if result.scalar_one_or_none():
            continue
        session.add(Skill(name=skill_name))
        created += 1

    if created:
        print(f"  Added {created} skill(s): {', '.join(SEED_SKILLS[:created])}")
    else:
        print("  All skills already exist")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        async with session.begin():
            print("Seeding admin user...")
            await seed_admin(session)
            print("Seeding skills...")
            await seed_skills(session)

    await engine.dispose()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
