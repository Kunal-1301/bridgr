from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentMarkIn(BaseModel):
    paymentId: UUID
    amount: float | None = Field(default=None, gt=0)
    method: str | None = None
    paidAt: datetime | None = None
    notes: str | None = None


class PaymentSummaryOut(BaseModel):
    total: float = 0
    outstanding: float = 0
    rows: list[dict] = []
