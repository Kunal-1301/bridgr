from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    model = AuditLog

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_all(
        self,
        actor_user_id: UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        base = select(AuditLog)
        if actor_user_id:
            base = base.where(AuditLog.actor_user_id == actor_user_id)
        if action:
            base = base.where(AuditLog.action == action)
        if entity_type:
            base = base.where(AuditLog.entity_type == entity_type)
        if date_from:
            base = base.where(AuditLog.created_at >= date_from)
        if date_to:
            base = base.where(AuditLog.created_at <= date_to)
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_recent(self, limit: int = 20) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
