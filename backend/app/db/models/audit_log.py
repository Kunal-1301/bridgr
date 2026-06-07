"""Audit log model."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.user import Base


class AuditLog(Base):
    """Immutable audit trail for all significant admin and system actions."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(120))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    # 'metadata' is reserved by SQLAlchemy's DeclarativeBase — column stored as 'metadata'
    log_metadata: Mapped[dict | None] = mapped_column("metadata", JSON)
    ip_address: Mapped[str | None] = mapped_column(String(80))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_audit_logs_actor_user_id", "actor_user_id"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_entity_type", "entity_type"),
        Index("idx_audit_logs_created_at", "created_at"),
    )
