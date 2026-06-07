from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.client import ClientProfile
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository[ClientProfile]):
    model = ClientProfile

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_by_user_id(self, user_id: UUID) -> ClientProfile | None:
        result = await self.db.execute(
            select(ClientProfile).where(ClientProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def count_all(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(ClientProfile))
        return result.scalar_one()

    async def list_all(
        self,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ClientProfile], int]:
        base = select(ClientProfile)
        if search:
            base = base.where(
                ClientProfile.company_name.ilike(f"%{search}%")
                | ClientProfile.contact_name.ilike(f"%{search}%")
                | ClientProfile.contact_email.ilike(f"%{search}%")
            )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(ClientProfile.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total
