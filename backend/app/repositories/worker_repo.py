from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.worker import WorkerDocument, WorkerProfile
from app.repositories.base import BaseRepository


class WorkerRepository(BaseRepository[WorkerProfile]):
    model = WorkerProfile

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_by_user_id(self, user_id: UUID) -> WorkerProfile | None:
        result = await self.db.execute(
            select(WorkerProfile).where(WorkerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def add_document(self, document: WorkerDocument) -> WorkerDocument:
        self.db.add(document)
        await self.db.flush()
        return document

    async def list_documents(self, worker_id: UUID) -> list[WorkerDocument]:
        result = await self.db.execute(
            select(WorkerDocument).where(WorkerDocument.worker_id == worker_id)
        )
        return list(result.scalars().all())
