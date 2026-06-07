from sqlalchemy.ext.asyncio import AsyncSession


class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
