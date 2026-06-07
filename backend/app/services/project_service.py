from sqlalchemy.ext.asyncio import AsyncSession


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
