"""Database enums for Bridgr."""

from enum import StrEnum


class UserRole(StrEnum):
    """User roles in the system."""

    admin = "admin"
    worker = "worker"
    client = "client"
    affiliate = "affiliate"


class UserStatus(StrEnum):
    """User account status."""

    active = "active"
    pending_verification = "pending_verification"
    suspended = "suspended"
    rejected = "rejected"
    deleted = "deleted"


class ExperienceLevel(StrEnum):
    """Worker experience level."""

    junior = "junior"
    mid = "mid"
    senior = "senior"
    expert = "expert"


class Availability(StrEnum):
    """Worker availability."""

    full_time = "full_time"
    part_time = "part_time"
    weekends = "weekends"
    unavailable = "unavailable"


class VerificationStatus(StrEnum):
    """Verification status for workers and documents."""

    draft = "draft"
    submitted = "submitted"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    flagged = "flagged"


class WorkerTier(StrEnum):
    """Worker tier/badge level."""

    newcomer = "newcomer"
    verified = "verified"
    certified = "certified"
    pro = "pro"
    elite = "elite"


class DocumentType(StrEnum):
    """Type of worker document."""

    resume = "resume"
    portfolio = "portfolio"
    id_proof = "id_proof"
    certificate = "certificate"
    other = "other"


class ClientStatus(StrEnum):
    """Client profile status."""

    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class BillingCurrency(StrEnum):
    """Billing currency."""

    USD = "USD"
    INR = "INR"


class ClientJobStatus(StrEnum):
    """Status of client job submission."""

    submitted = "submitted"
    under_review = "under_review"
    relisted = "relisted"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ClientVisibleJobStatus(StrEnum):
    """Client-visible job status (anonymized)."""

    submitted = "submitted"
    reviewing = "reviewing"
    in_progress = "in_progress"
    completed = "completed"


class JobCategory(StrEnum):
    """Job category."""

    development = "development"
    design = "design"
    content = "content"
    marketing = "marketing"
    operations = "operations"
    other = "other"


class JobListingType(StrEnum):
    """Listing type determines who can apply."""

    open_application = "open_application"
    invite_only = "invite_only"
    direct_assignment = "direct_assignment"


class JobListingStatus(StrEnum):
    """Status of job listing."""

    draft = "draft"
    published = "published"
    paused = "paused"
    closed = "closed"
    staffed = "staffed"
    cancelled = "cancelled"


class JobListingVisibility(StrEnum):
    """Who can see this listing."""

    all_verified = "all_verified"
    certified_only = "certified_only"
    invite_only = "invite_only"


class ApplicationStatus(StrEnum):
    """Status of worker application."""

    applied = "applied"
    shortlisted = "shortlisted"
    interview_scheduled = "interview_scheduled"
    selected = "selected"
    rejected = "rejected"
    withdrawn = "withdrawn"


class InterviewMode(StrEnum):
    """Interview mode."""

    online = "online"
    offline = "offline"
    assignment = "assignment"


class InterviewStatus(StrEnum):
    """Interview status."""

    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class ProjectStatus(StrEnum):
    """Project status."""

    not_started = "not_started"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"


class ProjectMemberRole(StrEnum):
    """Role of worker in project."""

    worker = "worker"
    team_lead = "team_lead"


class ProjectMemberStatus(StrEnum):
    """Status of worker in project."""

    active = "active"
    removed = "removed"
    completed = "completed"
    left = "left"


class ChannelType(StrEnum):
    """Project channel type."""

    general = "general"
    announcements = "announcements"
    files = "files"
    admin_private = "admin_private"


class MessageType(StrEnum):
    """Message type."""

    text = "text"
    file = "file"
    system = "system"


class TaskStatus(StrEnum):
    """Task status."""

    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"


class MilestoneStatus(StrEnum):
    """Milestone status."""

    pending = "pending"
    submitted = "submitted"
    approved = "approved"
    paid = "paid"
    disputed = "disputed"


class PayerType(StrEnum):
    """Who is paying."""

    client = "client"
    bridgr = "bridgr"


class PayeeType(StrEnum):
    """Who is receiving payment."""

    bridgr = "bridgr"
    worker = "worker"


class PaymentMethod(StrEnum):
    """Payment method."""

    bank_transfer = "bank_transfer"
    upi = "upi"
    stripe = "stripe"
    razorpay = "razorpay"
    wise = "wise"
    paypal = "paypal"
    manual = "manual"


class PaymentDirection(StrEnum):
    """Direction of payment flow."""

    inbound_client_payment = "inbound_client_payment"
    outbound_worker_payout = "outbound_worker_payout"


class PaymentStatus(StrEnum):
    """Payment status."""

    pending = "pending"
    received = "received"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"


class NotificationType(StrEnum):
    """Notification type."""

    info = "info"
    success = "success"
    warning = "warning"
    error = "error"
    job = "job"
    payment = "payment"
    project = "project"
    verification = "verification"


class ReferralType(StrEnum):
    """Type of referral."""

    worker = "worker"
    client = "client"
    affiliate = "affiliate"


class ReferralStatus(StrEnum):
    """Referral status."""

    clicked = "clicked"
    signed_up = "signed_up"
    approved = "approved"
    first_project = "first_project"
    commission_due = "commission_due"
    paid = "paid"


class SkillTestStatus(StrEnum):
    """Lifecycle status for a skill test."""

    draft = "draft"
    active = "active"
    archived = "archived"


class TestAttemptStatus(StrEnum):
    """Worker test attempt status."""

    started = "started"
    submitted = "submitted"
    passed = "passed"
    failed = "failed"


class CertificationStatus(StrEnum):
    """Worker certification status."""

    active = "active"
    expired = "expired"
    revoked = "revoked"


class ReferralPayoutStatus(StrEnum):
    """Referral payout status."""

    pending = "pending"
    approved = "approved"
    paid = "paid"
    cancelled = "cancelled"


class AutomationRuleStatus(StrEnum):
    """Automation rule lifecycle status."""

    active = "active"
    paused = "paused"
    archived = "archived"


class AutomationRunStatus(StrEnum):
    """Automation execution result status."""

    success = "success"
    failed = "failed"
    skipped = "skipped"
