"""Payment ledger model."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import (
    BillingCurrency,
    PayeeType,
    PayerType,
    PaymentDirection,
    PaymentMethod,
    PaymentStatus,
)
from app.db.models.user import Base


class Payment(Base):
    """Manual payment ledger — tracks client inbound payments and worker payouts."""

    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id"),
    )
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("milestones.id"),
    )
    payer_type: Mapped[PayerType] = mapped_column(Enum(PayerType, name="payer_type"), nullable=False)
    payee_type: Mapped[PayeeType] = mapped_column(Enum(PayeeType, name="payee_type"), nullable=False)
    client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("client_profiles.id"),
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("worker_profiles.id"),
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[BillingCurrency] = mapped_column(
        Enum(BillingCurrency, name="billing_currency"),
        nullable=False,
    )
    payment_direction: Mapped[PaymentDirection] = mapped_column(
        Enum(PaymentDirection, name="payment_direction"),
        nullable=False,
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method"),
        nullable=False,
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"),
        default=PaymentStatus.pending,
        nullable=False,
    )
    transaction_reference: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    marked_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    marked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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
        Index("idx_payments_project_id", "project_id"),
        Index("idx_payments_milestone_id", "milestone_id"),
        Index("idx_payments_client_id", "client_id"),
        Index("idx_payments_worker_id", "worker_id"),
        Index("idx_payments_status", "status"),
        Index("idx_payments_created_at", "created_at"),
    )
