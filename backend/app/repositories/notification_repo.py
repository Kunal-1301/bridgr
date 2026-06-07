from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import NotificationType
from app.db.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_by_user(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Notification], int]:
        base = select(Notification).where(Notification.user_id == user_id)
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def count_unread(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
        )
        return result.scalar_one()

    async def get_recent(self, user_id: UUID, limit: int = 5) -> list[Notification]:
        result = await self.db.execute(
            select(Notification).where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def mark_read(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        notif = await self.get_by_id_and_user(notification_id, user_id)
        if not notif:
            return None
        notif.is_read = True
        notif.read_at = datetime.now(UTC)
        await self.db.flush()
        return notif

    async def create(
        self,
        user_id: UUID,
        title: str,
        body: str,
        notification_type: NotificationType = NotificationType.info,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
        )
        self.db.add(notif)
        await self.db.flush()
        return notif
