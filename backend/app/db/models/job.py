"""Job submission and listing models."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import (
    BillingCurrency,
    ClientJobStatus,
    ClientVisibleJobStatus,
    JobCategory,
    JobListingStatus,
    JobListingType,
    JobListingVisibility,
)
from app.db.models.user import Base


class ClientJob(Base):
    """Admin-facing raw job submission from client."""

    __tablename__ = "client_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_profiles.id"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[JobCategory] = mapped_column(Enum(JobCategory, name="job_category"), nullable=False)
    required_skills: Mapped[list | None] = mapped_column(JSON)
    client_budget_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    client_budget_currency: Mapped[BillingCurrency] = mapped_column(
        Enum(BillingCurrency, name="billing_currency"),
        default=BillingCurrency.USD,
    )
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expected_team_size: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[ClientJobStatus] = mapped_column(
        Enum(ClientJobStatus, name="client_job_status"),
        default=ClientJobStatus.submitted,
    )
    client_visible_status: Mapped[ClientVisibleJobStatus] = mapped_column(
        Enum(ClientVisibleJobStatus, name="client_visible_job_status"),
        default=ClientVisibleJobStatus.submitted,
    )
    confidential_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_client_jobs_client_id", "client_id"),
        Index("idx_client_jobs_status", "status"),
        Index("idx_client_jobs_created_at", "created_at"),
    )


class JobListing(Base):
    """Worker-facing sanitized job listing (derived from ClientJob)."""

    __tablename__ = "job_listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_jobs.id"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    public_description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[JobCategory] = mapped_column(Enum(JobCategory, name="job_category"), nullable=False)
    required_skills: Mapped[list | None] = mapped_column(JSON)
    worker_budget_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    worker_budget_currency: Mapped[BillingCurrency] = mapped_column(
        Enum(BillingCurrency, name="billing_currency"),
        default=BillingCurrency.INR,
    )
    estimated_duration: Mapped[str | None] = mapped_column(String(100))
    application_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    openings: Mapped[int] = mapped_column(Integer, default=1)
    listing_type: Mapped[JobListingType] = mapped_column(
        Enum(JobListingType, name="job_listing_type"),
        default=JobListingType.open_application,
    )
    status: Mapped[JobListingStatus] = mapped_column(
        Enum(JobListingStatus, name="job_listing_status"),
        default=JobListingStatus.draft,
    )
    visibility: Mapped[JobListingVisibility] = mapped_column(
        Enum(JobListingVisibility, name="job_listing_visibility"),
        default=JobListingVisibility.all_verified,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_job_listings_client_job_id", "client_job_id"),
        Index("idx_job_listings_status", "status"),
        Index("idx_job_listings_created_by", "created_by"),
        Index("idx_job_listings_created_at", "created_at"),
    )
