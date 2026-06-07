from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ApplicationStatus
from app.db.models.application import Application
from app.db.models.job import JobListing
from app.repositories.base import BaseRepository

_ACTIVE_STATUSES = (
    ApplicationStatus.applied,
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_scheduled,
    ApplicationStatus.selected,
)


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_by_listing_and_worker(self, listing_id: UUID, worker_id: UUID) -> Application | None:
        result = await self.db.execute(
            select(Application).where(
                Application.listing_id == listing_id,
                Application.worker_id == worker_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        listing_id: UUID,
        worker_id: UUID,
        cover_letter: str,
        proposed_rate: float | None = None,
    ) -> Application:
        app = Application(
            listing_id=listing_id,
            worker_id=worker_id,
            cover_letter=cover_letter,
            proposed_rate_amount=proposed_rate,
        )
        self.db.add(app)
        await self.db.flush()
        return app

    async def count_active_by_worker(self, worker_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Application).where(
                Application.worker_id == worker_id,
                Application.status.in_(_ACTIVE_STATUSES),
            )
        )
        return result.scalar_one()

    async def list_by_worker(
        self,
        worker_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[tuple[Application, str]], int]:
        count_result = await self.db.execute(
            select(func.count()).select_from(Application).where(Application.worker_id == worker_id)
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Application, JobListing.title)
            .join(JobListing, JobListing.id == Application.listing_id)
            .where(Application.worker_id == worker_id)
            .order_by(Application.applied_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = [(row[0], row[1]) for row in result.all()]
        return rows, total

    async def list_all(
        self,
        listing_id: UUID | None = None,
        worker_id: UUID | None = None,
        status: ApplicationStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Application], int]:
        base = select(Application)
        if listing_id:
            base = base.where(Application.listing_id == listing_id)
        if worker_id:
            base = base.where(Application.worker_id == worker_id)
        if status:
            base = base.where(Application.status == status)

        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()

        result = await self.db.execute(
            base.order_by(Application.applied_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def update_status(
        self,
        application_id: UUID,
        status: ApplicationStatus,
        admin_notes: str | None = None,
        admin_score: int | None = None,
    ) -> Application | None:
        app = await self.db.get(Application, application_id)
        if not app:
            return None
        app.status = status
        if admin_notes is not None:
            app.admin_notes = admin_notes
        if admin_score is not None:
            app.admin_score = admin_score
        await self.db.flush()
        return app
