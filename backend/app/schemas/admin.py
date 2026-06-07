from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.db.enums import (
    ApplicationStatus,
    BillingCurrency,
    JobCategory,
    JobListingStatus,
    JobListingType,
    JobListingVisibility,
    NotificationType,
    PaymentDirection,
    PaymentMethod,
    ProjectMemberRole,
)


# ── Dashboard ────────────────────────────────────────────────────

class AdminDashboardOut(BaseModel):
    totalWorkers: int = 0
    pendingVerificationWorkers: int = 0
    totalClients: int = 0
    submittedClientJobs: int = 0
    publishedListings: int = 0
    activeProjects: int = 0
    inboundThisMonth: float = 0.0
    payoutsThisMonth: float = 0.0
    grossMarginThisMonth: float = 0.0
    recentAuditLogs: list[dict] = []


# ── Workers ─────────────────────────────────────────────────────

class AdminWorkerOut(BaseModel):
    profileId: UUID
    userId: UUID
    fullName: str | None = None
    email: str
    phone: str | None = None
    headline: str | None = None
    bio: str | None = None
    city: str | None = None
    skills: list[str] = []
    experienceLevel: str | None = None
    hourlyRateMinInr: int | None = None
    hourlyRateMaxInr: int | None = None
    verificationStatus: str
    tier: str
    trustScore: int
    userStatus: str
    approvedAt: datetime | None = None
    createdAt: datetime


class WorkerApproveIn(BaseModel):
    notes: str | None = None


class WorkerRejectIn(BaseModel):
    reason: str = Field(min_length=5, max_length=500)


class WorkerFlagIn(BaseModel):
    reason: str = Field(min_length=5, max_length=500)
    suspend: bool = False


# ── Clients ─────────────────────────────────────────────────────

class AdminClientCreateIn(BaseModel):
    email: EmailStr
    fullName: str = Field(min_length=2, max_length=120)
    companyName: str = Field(min_length=2, max_length=180)
    contactName: str = Field(min_length=2, max_length=160)
    contactPhone: str | None = None
    country: str | None = None
    billingCurrency: BillingCurrency = BillingCurrency.USD
    temporaryPassword: str | None = Field(default=None, min_length=8)


class AdminClientOut(BaseModel):
    profileId: UUID
    userId: UUID
    companyName: str
    contactName: str
    contactEmail: str | None = None
    contactPhone: str | None = None
    country: str | None = None
    billingCurrency: str
    status: str
    userEmail: str
    createdAt: datetime


# ── Client Jobs ─────────────────────────────────────────────────

class AdminClientJobOut(BaseModel):
    id: UUID
    clientId: UUID
    title: str
    description: str
    category: str
    requiredSkills: list[str] = []
    clientBudgetAmount: float | None = None
    clientBudgetCurrency: str
    deadline: datetime | None = None
    expectedTeamSize: int | None = None
    status: str
    clientVisibleStatus: str
    confidentialNotes: str | None = None
    createdAt: datetime


# ── Job Listings ─────────────────────────────────────────────────

class AdminJobListingCreateIn(BaseModel):
    clientJobId: UUID
    title: str = Field(min_length=8, max_length=200)
    publicDescription: str = Field(min_length=50, max_length=4000)
    category: JobCategory
    requiredSkills: list[str] = Field(default_factory=list, max_length=15)
    workerBudgetAmount: float = Field(gt=0)
    workerBudgetCurrency: BillingCurrency = BillingCurrency.INR
    estimatedDuration: str | None = None
    applicationDeadline: datetime | None = None
    openings: int = Field(default=1, ge=1)
    listingType: JobListingType = JobListingType.open_application
    visibility: JobListingVisibility = JobListingVisibility.all_verified


class AdminJobListingOut(BaseModel):
    id: UUID
    clientJobId: UUID
    title: str
    publicDescription: str
    category: str
    requiredSkills: list[str] = []
    workerBudgetAmount: float
    workerBudgetCurrency: str
    estimatedDuration: str | None = None
    applicationDeadline: datetime | None = None
    openings: int
    listingType: str
    status: str
    visibility: str
    publishedAt: datetime | None = None
    createdAt: datetime


# ── Applications ─────────────────────────────────────────────────

class ApplicationUpdateIn(BaseModel):
    status: ApplicationStatus
    adminNotes: str | None = None
    adminScore: int | None = Field(default=None, ge=0, le=100)


class AdminApplicationOut(BaseModel):
    id: UUID
    listingId: UUID
    workerId: UUID
    coverLetter: str | None = None
    proposedRateAmount: float | None = None
    status: str
    adminScore: int | None = None
    adminNotes: str | None = None
    appliedAt: datetime


# ── Projects ─────────────────────────────────────────────────────

class ProjectMemberCreateIn(BaseModel):
    workerId: UUID
    role: ProjectMemberRole = ProjectMemberRole.worker
    agreedAmount: float = Field(gt=0)
    agreedCurrency: BillingCurrency = BillingCurrency.INR


class AdminProjectCreateIn(BaseModel):
    clientJobId: UUID | None = None
    listingId: UUID | None = None
    title: str = Field(min_length=3, max_length=200)
    internalDescription: str | None = None
    clientVisibleSummary: str | None = None
    dueDate: datetime | None = None
    members: list[ProjectMemberCreateIn] = Field(default_factory=list)


class AdminProjectMemberAddIn(BaseModel):
    workerId: UUID
    role: ProjectMemberRole = ProjectMemberRole.worker
    agreedAmount: float = Field(gt=0)
    agreedCurrency: BillingCurrency = BillingCurrency.INR


class AdminProjectOut(BaseModel):
    id: UUID
    clientJobId: UUID | None = None
    listingId: UUID | None = None
    title: str
    internalDescription: str | None = None
    clientVisibleSummary: str | None = None
    status: str
    startDate: datetime | None = None
    dueDate: datetime | None = None
    createdAt: datetime


# ── Payments ─────────────────────────────────────────────────────

class ClientPaymentCreateIn(BaseModel):
    projectId: UUID | None = None
    clientId: UUID
    amount: float = Field(gt=0)
    currency: BillingCurrency = BillingCurrency.USD
    paymentMethod: PaymentMethod
    transactionReference: str | None = None
    notes: str | None = None


class WorkerPayoutCreateIn(BaseModel):
    projectId: UUID | None = None
    workerId: UUID
    milestoneId: UUID | None = None
    amount: float = Field(gt=0)
    currency: BillingCurrency = BillingCurrency.INR
    paymentMethod: PaymentMethod
    transactionReference: str | None = None
    notes: str | None = None


class AdminPaymentOut(BaseModel):
    id: UUID
    projectId: UUID | None = None
    milestoneId: UUID | None = None
    payerType: str
    payeeType: str
    clientId: UUID | None = None
    workerId: UUID | None = None
    amount: float
    currency: str
    paymentDirection: str
    paymentMethod: str
    status: str
    transactionReference: str | None = None
    notes: str | None = None
    markedBy: UUID | None = None
    markedAt: datetime | None = None
    createdAt: datetime


class MarginReportOut(BaseModel):
    totalClientReceived: float = 0.0
    totalWorkerPayouts: float = 0.0
    grossMargin: float = 0.0
    marginPct: float = 0.0
    byProject: list[dict] = []


# ── Audit ────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: UUID
    actorUserId: UUID | None = None
    action: str
    entityType: str | None = None
    entityId: UUID | None = None
    metadata: dict | None = None
    ipAddress: str | None = None
    createdAt: datetime


# ── Notifications ────────────────────────────────────────────────

class AdminNotificationSendIn(BaseModel):
    userId: UUID | None = None
    role: str | None = None
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=2000)
    notificationType: NotificationType = NotificationType.info
