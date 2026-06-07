"""Application and interview models."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import (
    ApplicationStatus,
    BillingCurrency,
    InterviewMode,
    InterviewStatus,
)
from app.db.models.user import Base


class Application(Base):
    """Worker application to a job listing."""

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_listings.id"),
        nullable=False,
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("worker_profiles.id"),
        nullable=False,
    )
    cover_letter: Mapped[str | None] = mapped_column(Text)
    proposed_rate_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    proposed_rate_currency: Mapped[BillingCurrency | None] = mapped_column(
        Enum(BillingCurrency, name="billing_currency")
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.applied,
    )
    admin_score: Mapped[int | None] = mapped_column(Integer)
    admin_notes: Mapped[str | None] = mapped_column(Text)
    applied_at: Mapped[datetime] = mapped_column(
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
        UniqueConstraint("listing_id", "worker_id", name="uq_applications_listing_worker"),
        Index("idx_applications_listing_id", "listing_id"),
        Index("idx_applications_worker_id", "worker_id"),
        Index("idx_applications_status", "status"),
        Index("idx_applications_applied_at", "applied_at"),
    )


class Interview(Base):
    """Interview scheduled for a job application."""

    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id"),
        nullable=False,
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    mode: Mapped[InterviewMode] = mapped_column(Enum(InterviewMode, name="interview_mode"), nullable=False)
    meeting_link: Mapped[str | None] = mapped_column(String(500))
    location: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[InterviewStatus] = mapped_column(
        Enum(InterviewStatus, name="interview_status"),
        default=InterviewStatus.scheduled,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text)
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
        Index("idx_interviews_application_id", "application_id"),
        Index("idx_interviews_scheduled_at", "scheduled_at"),
        Index("idx_interviews_created_at", "created_at"),
    )
