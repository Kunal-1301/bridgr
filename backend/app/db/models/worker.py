"""Worker profile and document models."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import (
    Availability,
    DocumentType,
    ExperienceLevel,
    VerificationStatus,
    WorkerTier,
)
from app.db.models.user import Base


class WorkerProfile(Base):
    """Worker profile model."""

    __tablename__ = "worker_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )
    headline: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    country: Mapped[str] = mapped_column(String(100), default="India")
    city: Mapped[str | None] = mapped_column(String(100))
    timezone: Mapped[str | None] = mapped_column(String(50))
    experience_level: Mapped[ExperienceLevel | None] = mapped_column(
        Enum(ExperienceLevel, name="experience_level")
    )
    skills: Mapped[list | None] = mapped_column(JSON)
    hourly_rate_min_inr: Mapped[int | None] = mapped_column(Integer)
    hourly_rate_max_inr: Mapped[int | None] = mapped_column(Integer)
    availability: Mapped[Availability | None] = mapped_column(Enum(Availability, name="availability"))
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.draft,
    )
    tier: Mapped[WorkerTier] = mapped_column(Enum(WorkerTier, name="worker_tier"), default=WorkerTier.newcomer)
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    admin_notes: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
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
        Index("idx_worker_profiles_user_id", "user_id"),
        Index("idx_worker_profiles_verification_status", "verification_status"),
        Index("idx_worker_profiles_tier", "tier"),
        Index("idx_worker_profiles_created_at", "created_at"),
    )


class WorkerDocument(Base):
    """Worker uploaded documents (resume, portfolio, certificates, etc.)."""

    __tablename__ = "worker_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("worker_profiles.id"),
        nullable=False,
    )
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType, name="document_type"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(500))
    file_key: Mapped[str | None] = mapped_column(String(500))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[int | None] = mapped_column(Integer)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.pending,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    __table_args__ = (
        Index("idx_worker_documents_worker_id", "worker_id"),
        Index("idx_worker_documents_uploaded_at", "uploaded_at"),
    )
