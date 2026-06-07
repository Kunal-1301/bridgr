from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import String, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import JobCategory, JobListingStatus
from app.db.models.job import ClientJob, JobListing
from app.repositories.base import BaseRepository


class ClientJobRepository(BaseRepository[ClientJob]):
    model = ClientJob

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_by_client(
        self,
        client_id: UUID,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ClientJob], int]:
        base = select(ClientJob).where(ClientJob.client_id == client_id)
        if status:
            base = base.where(ClientJob.status == status)
        if search:
            base = base.where(
                ClientJob.title.ilike(f"%{search}%") | ClientJob.description.ilike(f"%{search}%")
            )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(ClientJob.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_by_id_and_client(self, job_id: UUID, client_id: UUID) -> ClientJob | None:
        result = await self.db.execute(
            select(ClientJob).where(ClientJob.id == job_id, ClientJob.client_id == client_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        client_id: UUID | None = None,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ClientJob], int]:
        base = select(ClientJob)
        if client_id:
            base = base.where(ClientJob.client_id == client_id)
        if status:
            base = base.where(ClientJob.status == status)
        if search:
            base = base.where(
                ClientJob.title.ilike(f"%{search}%") | ClientJob.description.ilike(f"%{search}%")
            )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(ClientJob.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def count_submitted(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(ClientJob).where(ClientJob.status == "submitted")
        )
        return result.scalar_one()


class JobListingRepository(BaseRepository[JobListing]):
    model = JobListing

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_published(
        self,
        skill: str | None = None,
        category: JobCategory | None = None,
        budget_min: float | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[JobListing], int]:
        base = select(JobListing).where(JobListing.status == JobListingStatus.published)
        if skill:
            base = base.where(cast(JobListing.required_skills, String).ilike(f'%"{skill}"%'))
        if category:
            base = base.where(JobListing.category == category)
        if budget_min is not None:
            base = base.where(JobListing.worker_budget_amount >= budget_min)
        if search:
            base = base.where(
                JobListing.title.ilike(f"%{search}%") | JobListing.public_description.ilike(f"%{search}%")
            )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(JobListing.published_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_published(self, listing_id: UUID) -> JobListing | None:
        result = await self.db.execute(
            select(JobListing).where(
                JobListing.id == listing_id,
                JobListing.status == JobListingStatus.published,
            )
        )
        return result.scalar_one_or_none()

    async def count_published(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(JobListing).where(JobListing.status == JobListingStatus.published)
        )
        return result.scalar_one()

    async def list_all(
        self,
        status: JobListingStatus | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[JobListing], int]:
        base = select(JobListing)
        if status:
            base = base.where(JobListing.status == status)
        if search:
            base = base.where(JobListing.title.ilike(f"%{search}%"))
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(JobListing.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def publish(self, listing_id: UUID) -> JobListing | None:
        listing = await self.db.get(JobListing, listing_id)
        if not listing:
            return None
        listing.status = JobListingStatus.published
        listing.published_at = datetime.now(UTC)
        await self.db.flush()
        return listing
