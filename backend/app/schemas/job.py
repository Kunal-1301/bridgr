from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MilestoneIn(BaseModel):
    title: str
    amount: float
    dueDate: date


class ClientJobCreateIn(BaseModel):
    title: str = Field(min_length=10, max_length=100)
    description: str = Field(min_length=50, max_length=2000)
    requiredSkills: list[str] = Field(min_length=1, max_length=10)
    paymentType: str
    totalBudget: float | None = None
    milestones: list[MilestoneIn] | None = None
    estimatedHours: float | None = None
    hourlyRate: float | None = None
    teamSize: int = Field(gt=0)
    deadline: date
    deliverables: list[str] = Field(min_length=1)
    notes: str | None = None
    attachmentKeys: list[str] = []


class ClientJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    skills: list[str] = []
    status: str
    submissionDate: datetime | None = None
    budget: float
    paymentType: str
    progress: int = 0
    milestones: list[dict] = []
    deliverables: list[dict] = []
    updates: list[dict] = []


class JobListingCreateIn(BaseModel):
    sourceClientJobId: UUID | None = None
    title: str = Field(min_length=8, max_length=140)
    description: str = Field(min_length=50, max_length=4000)
    requiredSkills: list[str] = Field(min_length=1, max_length=15)
    paymentType: str
    workerBudget: float = Field(gt=0)
    clientBudget: float | None = None
    marginPercent: float | None = Field(default=None, ge=0, le=90)
    teamSize: int = Field(gt=0)
    deadline: date
    visibility: str
    visibilitySkills: list[str] = []
    invitedWorkerIds: list[UUID] = []
    minTier: str


class WorkerJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    skills: list[str] = []
    budget: float
    paymentType: str
    teamSize: int
    deadline: date | None = None
    duration: str | None = None
    description: str
    deliverables: list[str] = []
    applicationsReceived: int = 0
    visibility: str
