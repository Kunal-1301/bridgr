from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Profile ────────────────────────────────────────────────────

class ClientProfileOut(BaseModel):
    id: UUID
    userId: UUID
    companyName: str
    contactName: str
    contactPhone: str | None = None
    country: str | None = None
    timezone: str | None = None
    billingCurrency: str
    status: str
    createdAt: datetime | None = None


class ClientProfileUpdateIn(BaseModel):
    contactName: str | None = Field(default=None, min_length=2, max_length=160)
    contactPhone: str | None = Field(default=None, min_length=7, max_length=20)
    timezone: str | None = Field(default=None, max_length=50)


# ── Jobs ────────────────────────────────────────────────────────

class ClientJobCreateIn(BaseModel):
    title: str = Field(min_length=10, max_length=200)
    description: str = Field(min_length=50, max_length=4000)
    category: str
    requiredSkills: list[str] = Field(default_factory=list, max_length=10)
    clientBudgetAmount: float = Field(gt=0)
    clientBudgetCurrency: str = "USD"
    deadline: datetime | None = None
    expectedTeamSize: int = Field(default=1, ge=1)
    notes: str | None = None


class ClientJobOut(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    requiredSkills: list[str] = []
    clientVisibleStatus: str
    clientBudgetAmount: float | None = None
    clientBudgetCurrency: str
    deadline: datetime | None = None
    expectedTeamSize: int | None = None
    createdAt: datetime


# ── Projects (client-facing, sanitized) ────────────────────────

class ClientProjectOut(BaseModel):
    id: UUID
    title: str
    status: str
    clientVisibleSummary: str | None = None
    startDate: datetime | None = None
    dueDate: datetime | None = None
    createdAt: datetime


class ClientMilestoneSummaryOut(BaseModel):
    id: UUID
    title: str
    status: str
    dueDate: datetime | None = None


class ClientProjectDetailOut(ClientProjectOut):
    milestones: list[ClientMilestoneSummaryOut] = []


# ── Payments (client inbound) ───────────────────────────────────

class ClientPaymentOut(BaseModel):
    id: UUID
    projectId: UUID | None = None
    amount: float
    currency: str
    status: str
    paymentMethod: str
    createdAt: datetime


# ── Support ─────────────────────────────────────────────────────

class SupportTicketIn(BaseModel):
    category: str
    subject: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=20, max_length=2000)
    attachmentKey: str | None = None


# ── Dashboard ────────────────────────────────────────────────────

class ClientDashboardOut(BaseModel):
    totalJobs: int = 0
    activeProjects: int = 0
    completedProjects: int = 0
    pendingPaymentsAmount: float = 0.0
    recentJobStatuses: list[ClientJobOut] = []
