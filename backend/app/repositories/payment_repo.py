from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import PaymentDirection, PaymentStatus
from app.db.models.payment import Payment
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    model = Payment

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def sum_pending_by_worker(self, worker_id: UUID) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.worker_id == worker_id,
                Payment.status == PaymentStatus.pending,
                Payment.payment_direction == PaymentDirection.outbound_worker_payout,
            )
        )
        return float(result.scalar_one())

    async def list_by_worker(
        self,
        worker_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Payment], int]:
        base = select(Payment).where(
            Payment.worker_id == worker_id,
            Payment.payment_direction == PaymentDirection.outbound_worker_payout,
        )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def list_by_client(
        self,
        client_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Payment], int]:
        base = select(Payment).where(
            Payment.client_id == client_id,
            Payment.payment_direction == PaymentDirection.inbound_client_payment,
        )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def list_all(
        self,
        status: PaymentStatus | None = None,
        direction: PaymentDirection | None = None,
        client_id: UUID | None = None,
        worker_id: UUID | None = None,
        project_id: UUID | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Payment], int]:
        base = select(Payment)
        if status:
            base = base.where(Payment.status == status)
        if direction:
            base = base.where(Payment.payment_direction == direction)
        if client_id:
            base = base.where(Payment.client_id == client_id)
        if worker_id:
            base = base.where(Payment.worker_id == worker_id)
        if project_id:
            base = base.where(Payment.project_id == project_id)
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def sum_inbound_this_month(self) -> float:
        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.payment_direction == PaymentDirection.inbound_client_payment,
                Payment.status == PaymentStatus.received,
                Payment.created_at >= month_start,
            )
        )
        return float(result.scalar_one())

    async def sum_outbound_this_month(self) -> float:
        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.payment_direction == PaymentDirection.outbound_worker_payout,
                Payment.status == PaymentStatus.paid,
                Payment.created_at >= month_start,
            )
        )
        return float(result.scalar_one())

    async def margin_report(self) -> list[dict]:
        result = await self.db.execute(
            select(
                Payment.project_id,
                func.sum(
                    func.case(
                        (Payment.payment_direction == PaymentDirection.inbound_client_payment, Payment.amount),
                        else_=0,
                    )
                ).label("client_received"),
                func.sum(
                    func.case(
                        (Payment.payment_direction == PaymentDirection.outbound_worker_payout, Payment.amount),
                        else_=0,
                    )
                ).label("worker_paid"),
            )
            .where(Payment.status.in_((PaymentStatus.received, PaymentStatus.paid)))
            .group_by(Payment.project_id)
        )
        rows = []
        for row in result.all():
            client_received = float(row.client_received or 0)
            worker_paid = float(row.worker_paid or 0)
            margin = client_received - worker_paid
            rows.append({
                "projectId": str(row.project_id) if row.project_id else None,
                "clientReceived": client_received,
                "workerPaid": worker_paid,
                "margin": margin,
                "marginPct": round(margin / client_received * 100, 2) if client_received else 0,
            })
        return rows
