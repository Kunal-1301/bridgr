from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectCreateIn(BaseModel):
    clientJobId: UUID | None = None
    jobListingId: UUID | None = None
    title: str
    startDate: date | None = None
    endDate: date | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    status: str
    startDate: date | None = None
    endDate: date | None = None
    createdAt: datetime | None = None
