"""Referral tracking model."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.enums import BillingCurrency, ReferralStatus, ReferralType
from app.db.models.user import Base


class Referral(Base):
    """Tracks referral links, sign-ups, and commission payouts."""

    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referrer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    referred_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
    )
    referral_code: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    referral_type: Mapped[ReferralType] = mapped_column(
        Enum(ReferralType, name="referral_type"),
        nullable=False,
    )
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(ReferralStatus, name="referral_status"),
        default=ReferralStatus.clicked,
        nullable=False,
    )
    commission_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    commission_currency: Mapped[BillingCurrency | None] = mapped_column(
        Enum(BillingCurrency, name="billing_currency"),
    )
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
        UniqueConstraint("referral_code", name="uq_referrals_code"),
        Index("idx_referrals_referrer_user_id", "referrer_user_id"),
        Index("idx_referrals_referred_user_id", "referred_user_id"),
        Index("idx_referrals_referral_code", "referral_code"),
        Index("idx_referrals_created_at", "created_at"),
    )
