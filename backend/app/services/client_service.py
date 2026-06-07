from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.enums import BillingCurrency, JobCategory, PaymentDirection, PaymentStatus, ProjectStatus
from app.db.models.client import ClientProfile
from app.db.models.job import ClientJob
from app.db.models.payment import Payment
from app.db.models.project import Project
from app.db.models.user import User
from app.repositories.client_repo import ClientRepository
from app.repositories.job_repo import ClientJobRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.project_repo import ProjectRepository
from app.schemas.client import (
    ClientDashboardOut,
    ClientJobCreateIn,
    ClientJobOut,
    ClientMilestoneSummaryOut,
    ClientPaymentOut,
    ClientProfileOut,
    ClientProfileUpdateIn,
    ClientProjectDetailOut,
    ClientProjectOut,
    SupportTicketIn,
)
from app.services.audit_service import AuditService
from app.utils.pagination import Page, PaginationParams


def _build_client_profile(user: User, cp: ClientProfile) -> ClientProfileOut:
    return ClientProfileOut(
        id=cp.id,
        userId=cp.user_id,
        companyName=cp.company_name,
        contactName=cp.contact_name,
        contactPhone=cp.contact_phone,
        country=cp.country,
        timezone=cp.timezone,
        billingCurrency=cp.billing_currency.value,
        status=cp.status.value,
        createdAt=cp.created_at,
    )


def _build_job_out(job: ClientJob) -> ClientJobOut:
    return ClientJobOut(
        id=job.id,
        title=job.title,
        description=job.description,
        category=job.category.value,
        requiredSkills=job.required_skills or [],
        clientVisibleStatus=job.client_visible_status.value,
        clientBudgetAmount=float(job.client_budget_amount) if job.client_budget_amount else None,
        clientBudgetCurrency=job.client_budget_currency.value,
        deadline=job.deadline,
        expectedTeamSize=job.expected_team_size,
        createdAt=job.created_at,
    )


class ClientService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.clients = ClientRepository(db)
        self.jobs = ClientJobRepository(db)
        self.projects = ProjectRepository(db)
        self.payments = PaymentRepository(db)
        self.audit = AuditService(db)

    async def _get_client(self, user: User) -> ClientProfile:
        cp = await self.clients.get_by_user_id(user.id)
        if not cp:
            raise AppError("Client profile not found", 404, "not_found")
        return cp

    # ── Dashboard ──────────────────────────────────────────────

    async def dashboard(self, user: User) -> ClientDashboardOut:
        cp = await self._get_client(user)

        all_jobs, total_jobs = await self.jobs.list_by_client(cp.id, limit=1000, offset=0)
        client_job_ids = [j.id for j in all_jobs]
        all_projects, _ = await self.projects.list_by_client_job_ids(client_job_ids, limit=1000, offset=0)

        active_projects = sum(1 for p in all_projects if p.status in (ProjectStatus.active, ProjectStatus.not_started))
        completed_projects = sum(1 for p in all_projects if p.status == ProjectStatus.completed)

        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.client_id == cp.id,
                Payment.status == PaymentStatus.pending,
                Payment.payment_direction == PaymentDirection.inbound_client_payment,
            )
        )
        pending_payments = float(result.scalar_one())

        recent_jobs = [_build_job_out(j) for j in all_jobs[:5]]

        return ClientDashboardOut(
            totalJobs=total_jobs,
            activeProjects=active_projects,
            completedProjects=completed_projects,
            pendingPaymentsAmount=pending_payments,
            recentJobStatuses=recent_jobs,
        )

    # ── Profile ────────────────────────────────────────────────

    async def get_profile(self, user: User) -> ClientProfileOut:
        cp = await self._get_client(user)
        return _build_client_profile(user, cp)

    async def update_profile(
        self,
        user: User,
        data: ClientProfileUpdateIn,
        ip: str | None = None,
    ) -> ClientProfileOut:
        cp = await self._get_client(user)
        if data.contactName is not None:
            cp.contact_name = data.contactName
        if data.contactPhone is not None:
            cp.contact_phone = data.contactPhone
        if data.timezone is not None:
            cp.timezone = data.timezone
        await self.db.flush()
        await self.audit.log_client_profile_updated(user.id, cp.id, ip)
        await self.db.commit()
        return _build_client_profile(user, cp)

    # ── Jobs ───────────────────────────────────────────────────

    async def submit_job(
        self,
        user: User,
        data: ClientJobCreateIn,
        ip: str | None = None,
    ) -> ClientJobOut:
        cp = await self._get_client(user)
        try:
            category = JobCategory(data.category.lower())
        except ValueError:
            raise AppError(f"Invalid category: {data.category}", 422)
        try:
            currency = BillingCurrency(data.clientBudgetCurrency.upper())
        except ValueError:
            raise AppError(f"Invalid currency: {data.clientBudgetCurrency}", 422)

        job = ClientJob(
            client_id=cp.id,
            title=data.title,
            description=data.description,
            category=category,
            required_skills=data.requiredSkills,
            client_budget_amount=data.clientBudgetAmount,
            client_budget_currency=currency,
            deadline=data.deadline,
            expected_team_size=data.expectedTeamSize,
        )
        self.db.add(job)
        await self.db.flush()
        await self.audit.log_client_job_submitted(user.id, job.id, ip)
        await self.db.commit()
        return _build_job_out(job)

    async def list_jobs(
        self,
        user: User,
        params: PaginationParams,
        search: str | None = None,
        status: str | None = None,
    ) -> Page[ClientJobOut]:
        cp = await self._get_client(user)
        jobs, total = await self.jobs.list_by_client(
            client_id=cp.id,
            status=status,
            search=search,
            limit=params.page_size,
            offset=params.offset,
        )
        return Page.create([_build_job_out(j) for j in jobs], total, params)

    async def get_job(self, user: User, job_id: UUID) -> ClientJobOut:
        cp = await self._get_client(user)
        job = await self.jobs.get_by_id_and_client(job_id, cp.id)
        if not job:
            raise AppError("Job not found", 404, "not_found")
        return _build_job_out(job)

    # ── Projects ───────────────────────────────────────────────

    async def list_projects(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[ClientProjectOut]:
        cp = await self._get_client(user)
        all_jobs, _ = await self.jobs.list_by_client(cp.id, limit=1000, offset=0)
        client_job_ids = [j.id for j in all_jobs]
        projects, total = await self.projects.list_by_client_job_ids(
            client_job_ids,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            ClientProjectOut(
                id=p.id,
                title=p.title,
                status=p.status.value,
                clientVisibleSummary=p.client_visible_summary,
                startDate=p.start_date,
                dueDate=p.due_date,
                createdAt=p.created_at,
            )
            for p in projects
        ]
        return Page.create(items, total, params)

    async def get_project(self, user: User, project_id: UUID) -> ClientProjectDetailOut:
        cp = await self._get_client(user)
        all_jobs, _ = await self.jobs.list_by_client(cp.id, limit=1000, offset=0)
        client_job_ids = {j.id for j in all_jobs}

        project = await self.db.get(Project, project_id)
        if not project or project.client_job_id not in client_job_ids:
            raise AppError("Project not found", 404, "not_found")

        milestones_raw = await self.projects.get_milestones(project_id)
        milestones = [
            ClientMilestoneSummaryOut(
                id=m.id,
                title=m.title,
                status=m.status.value,
                dueDate=m.due_date,
            )
            for m in milestones_raw
        ]

        return ClientProjectDetailOut(
            id=project.id,
            title=project.title,
            status=project.status.value,
            clientVisibleSummary=project.client_visible_summary,
            startDate=project.start_date,
            dueDate=project.due_date,
            createdAt=project.created_at,
            milestones=milestones,
        )

    # ── Payments ───────────────────────────────────────────────

    async def list_payments(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[ClientPaymentOut]:
        cp = await self._get_client(user)
        payments, total = await self.payments.list_by_client(
            client_id=cp.id,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            ClientPaymentOut(
                id=p.id,
                projectId=p.project_id,
                amount=float(p.amount),
                currency=p.currency.value,
                status=p.status.value,
                paymentMethod=p.payment_method.value,
                createdAt=p.created_at,
            )
            for p in payments
        ]
        return Page.create(items, total, params)

    # ── Support ────────────────────────────────────────────────

    async def create_support_ticket(
        self,
        user: User,
        data: SupportTicketIn,
        ip: str | None = None,
    ) -> dict:
        await self.audit.log_support_ticket(
            user.id,
            {"category": data.category, "subject": data.subject},
            ip,
        )
        await self.db.commit()
        return {"ok": True, "message": "Support ticket received. Our team will reach out within 24 hours."}
