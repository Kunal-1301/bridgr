from sqlalchemy.ext.asyncio import AsyncSession


class JobService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
