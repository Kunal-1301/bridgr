from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreateIn(BaseModel):
    coverNote: str = Field(min_length=20, max_length=1000)


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    jobId: UUID
    jobTitle: str
    status: str
    appliedDate: datetime
    note: str | None = None
