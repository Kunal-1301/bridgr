"""Client profile model."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import BillingCurrency, ClientStatus
from app.db.models.user import Base


class ClientProfile(Base):
    """Client profile model."""

    __tablename__ = "client_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str | None] = mapped_column(String(120))
    timezone: Mapped[str | None] = mapped_column(String(50))
    billing_currency: Mapped[BillingCurrency] = mapped_column(
        Enum(BillingCurrency, name="billing_currency"),
        default=BillingCurrency.USD,
    )
    status: Mapped[ClientStatus] = mapped_column(
        Enum(ClientStatus, name="client_status"),
        default=ClientStatus.active,
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
        Index("idx_client_profiles_user_id", "user_id"),
        Index("idx_client_profiles_created_at", "created_at"),
    )
