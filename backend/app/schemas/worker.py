from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Profile ────────────────────────────────────────────────────

class WorkerProfileOut(BaseModel):
    id: UUID
    userId: UUID
    fullName: str | None = None
    email: str | None = None
    phone: str | None = None
    headline: str | None = None
    bio: str | None = None
    city: str | None = None
    timezone: str | None = None
    experienceLevel: str | None = None
    skills: list[str] = []
    hourlyRateMinInr: int | None = None
    hourlyRateMaxInr: int | None = None
    availability: str | None = None
    verificationStatus: str
    tier: str
    trustScore: int
    profileCompletionPct: int = 0
    createdAt: datetime | None = None


class WorkerProfileUpdateIn(BaseModel):
    fullName: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    headline: str | None = Field(default=None, max_length=200)
    bio: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=100)
    timezone: str | None = Field(default=None, max_length=50)
    experienceLevel: str | None = None
    skills: list[str] | None = None
    hourlyRateMinInr: int | None = Field(default=None, ge=0)
    hourlyRateMaxInr: int | None = Field(default=None, ge=0)
    availability: str | None = None


# ── Documents ──────────────────────────────────────────────────

class WorkerDocumentIn(BaseModel):
    documentType: str
    fileName: str = Field(min_length=1, max_length=500)
    mimeType: str | None = None


class WorkerDocumentOut(BaseModel):
    id: UUID
    documentType: str
    fileName: str
    fileUrl: str | None = None
    verificationStatus: str
    uploadedAt: datetime


# ── Jobs (worker-facing) ────────────────────────────────────────

class JobListingWorkerOut(BaseModel):
    id: UUID
    title: str
    category: str
    requiredSkills: list[str] = []
    workerBudgetAmount: float
    workerBudgetCurrency: str
    estimatedDuration: str | None = None
    applicationDeadline: datetime | None = None
    openings: int
    listingType: str
    publishedAt: datetime | None = None


class JobListingWorkerDetailOut(JobListingWorkerOut):
    publicDescription: str


# ── Applications ────────────────────────────────────────────────

class ApplicationCreateIn(BaseModel):
    coverLetter: str = Field(min_length=20, max_length=2000)
    proposedRateAmount: float | None = Field(default=None, gt=0)


class ApplicationWorkerOut(BaseModel):
    id: UUID
    listingId: UUID
    listingTitle: str
    status: str
    appliedAt: datetime
    coverLetter: str | None = None


# ── Projects (worker-facing) ────────────────────────────────────

class WorkerProjectOut(BaseModel):
    id: UUID
    title: str
    status: str
    role: str
    agreedAmount: float
    agreedCurrency: str
    startDate: datetime | None = None
    dueDate: datetime | None = None
    createdAt: datetime


class MilestoneWorkerOut(BaseModel):
    id: UUID
    title: str
    workerAmount: float
    currency: str
    status: str
    dueDate: datetime | None = None


class TaskOut(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    status: str
    dueDate: datetime | None = None


class ChannelOut(BaseModel):
    id: UUID
    name: str
    channelType: str


class WorkerProjectDetailOut(WorkerProjectOut):
    milestones: list[MilestoneWorkerOut] = []
    tasks: list[TaskOut] = []
    channels: list[ChannelOut] = []


# ── Messages ────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: UUID
    channelId: UUID
    senderId: UUID
    content: str
    messageType: str
    createdAt: datetime


class MessageCreateIn(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    channelId: UUID | None = None


# ── Payments (worker-facing) ────────────────────────────────────

class WorkerPaymentOut(BaseModel):
    id: UUID
    projectId: UUID | None = None
    amount: float
    currency: str
    status: str
    paymentMethod: str
    transactionReference: str | None = None
    notes: str | None = None
    createdAt: datetime


# ── Notifications ────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: UUID
    title: str
    body: str
    notificationType: str
    isRead: bool
    createdAt: datetime
    readAt: datetime | None = None


# ── Dashboard ────────────────────────────────────────────────────

class WorkerDashboardOut(BaseModel):
    profileCompletionPct: int = 0
    verificationStatus: str = "draft"
    availableJobsCount: int = 0
    activeApplicationsCount: int = 0
    activeProjectsCount: int = 0
    pendingPaymentsAmount: float = 0.0
    recentNotifications: list[NotificationOut] = []
    recommendedJobs: list[JobListingWorkerOut] = []
