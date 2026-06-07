from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import hash_password
from app.db.enums import (
    BillingCurrency,
    ChannelType,
    ClientJobStatus,
    JobListingStatus,
    NotificationType,
    PayeeType,
    PayerType,
    PaymentDirection,
    PaymentStatus,
    UserRole,
    UserStatus,
    VerificationStatus,
    WorkerTier,
)
from app.db.models.client import ClientProfile
from app.db.models.job import ClientJob, JobListing
from app.db.models.notification import Notification
from app.db.models.payment import Payment
from app.db.models.project import Project
from app.db.models.user import User
from app.db.models.worker import WorkerProfile
from app.repositories.application_repo import ApplicationRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.client_repo import ClientRepository
from app.repositories.job_repo import ClientJobRepository, JobListingRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.user_repo import UserRepository
from app.repositories.worker_repo import WorkerRepository
from app.schemas.admin import (
    AdminClientCreateIn,
    AdminClientJobOut,
    AdminClientOut,
    AdminDashboardOut,
    AdminJobListingCreateIn,
    AdminJobListingOut,
    AdminPaymentOut,
    AdminProjectCreateIn,
    AdminProjectMemberAddIn,
    AdminProjectOut,
    AdminWorkerOut,
    ApplicationUpdateIn,
    AuditLogOut,
    ClientPaymentCreateIn,
    MarginReportOut,
    WorkerPayoutCreateIn,
)
from app.services.audit_service import AuditService
from app.utils.pagination import Page, PaginationParams


def _build_worker_out(user: User, wp: WorkerProfile) -> AdminWorkerOut:
    return AdminWorkerOut(
        profileId=wp.id,
        userId=wp.user_id,
        fullName=user.full_name,
        email=user.email,
        phone=user.phone,
        headline=wp.headline,
        bio=wp.bio,
        city=wp.city,
        skills=wp.skills or [],
        experienceLevel=wp.experience_level.value if wp.experience_level else None,
        hourlyRateMinInr=wp.hourly_rate_min_inr,
        hourlyRateMaxInr=wp.hourly_rate_max_inr,
        verificationStatus=wp.verification_status.value,
        tier=wp.tier.value,
        trustScore=wp.trust_score,
        userStatus=user.status.value,
        approvedAt=wp.approved_at,
        createdAt=wp.created_at,
    )


def _build_client_out(user: User, cp: ClientProfile) -> AdminClientOut:
    return AdminClientOut(
        profileId=cp.id,
        userId=cp.user_id,
        companyName=cp.company_name,
        contactName=cp.contact_name,
        contactEmail=cp.contact_email,
        contactPhone=cp.contact_phone,
        country=cp.country,
        billingCurrency=cp.billing_currency.value,
        status=cp.status.value,
        userEmail=user.email,
        createdAt=cp.created_at,
    )


def _build_listing_out(listing: JobListing) -> AdminJobListingOut:
    return AdminJobListingOut(
        id=listing.id,
        clientJobId=listing.client_job_id,
        title=listing.title,
        publicDescription=listing.public_description,
        category=listing.category.value,
        requiredSkills=listing.required_skills or [],
        workerBudgetAmount=float(listing.worker_budget_amount),
        workerBudgetCurrency=listing.worker_budget_currency.value,
        estimatedDuration=listing.estimated_duration,
        applicationDeadline=listing.application_deadline,
        openings=listing.openings,
        listingType=listing.listing_type.value,
        status=listing.status.value,
        visibility=listing.visibility.value,
        publishedAt=listing.published_at,
        createdAt=listing.created_at,
    )


def _build_payment_out(p: Payment) -> AdminPaymentOut:
    return AdminPaymentOut(
        id=p.id,
        projectId=p.project_id,
        milestoneId=p.milestone_id,
        payerType=p.payer_type.value,
        payeeType=p.payee_type.value,
        clientId=p.client_id,
        workerId=p.worker_id,
        amount=float(p.amount),
        currency=p.currency.value,
        paymentDirection=p.payment_direction.value,
        paymentMethod=p.payment_method.value,
        status=p.status.value,
        transactionReference=p.transaction_reference,
        notes=p.notes,
        markedBy=p.marked_by,
        markedAt=p.marked_at,
        createdAt=p.created_at,
    )


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.workers = WorkerRepository(db)
        self.clients = ClientRepository(db)
        self.jobs = ClientJobRepository(db)
        self.listings = JobListingRepository(db)
        self.applications = ApplicationRepository(db)
        self.projects = ProjectRepository(db)
        self.payments = PaymentRepository(db)
        self.notifications = NotificationRepository(db)
        self.audit_repo = AuditRepository(db)
        self.audit = AuditService(db)

    # ── Dashboard ──────────────────────────────────────────────

    async def dashboard(self) -> AdminDashboardOut:
        total_workers_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.worker)
        )
        pending_workers_result = await self.db.execute(
            select(func.count()).select_from(WorkerProfile).where(
                WorkerProfile.verification_status == VerificationStatus.pending
            )
        )
        total_clients_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.client)
        )

        total_workers = total_workers_result.scalar_one()
        pending_workers = pending_workers_result.scalar_one()
        total_clients = total_clients_result.scalar_one()
        submitted_jobs = await self.jobs.count_submitted()
        published_listings = await self.listings.count_published()
        active_projects = await self.projects.count_active()
        inbound = await self.payments.sum_inbound_this_month()
        payouts = await self.payments.sum_outbound_this_month()
        recent_audit = await self.audit_repo.get_recent(limit=10)

        audit_dicts = [
            {
                "id": str(a.id),
                "action": a.action,
                "entityType": a.entity_type,
                "actorUserId": str(a.actor_user_id) if a.actor_user_id else None,
                "createdAt": a.created_at.isoformat(),
            }
            for a in recent_audit
        ]

        return AdminDashboardOut(
            totalWorkers=total_workers,
            pendingVerificationWorkers=pending_workers,
            totalClients=total_clients,
            submittedClientJobs=submitted_jobs,
            publishedListings=published_listings,
            activeProjects=active_projects,
            inboundThisMonth=inbound,
            payoutsThisMonth=payouts,
            grossMarginThisMonth=inbound - payouts,
            recentAuditLogs=audit_dicts,
        )

    # ── Workers ────────────────────────────────────────────────

    async def list_workers(
        self,
        params: PaginationParams,
        verification_status: str | None = None,
        tier: str | None = None,
        skill: str | None = None,
        search: str | None = None,
        status: str | None = None,
    ) -> Page[AdminWorkerOut]:
        from sqlalchemy import String, cast
        base = select(WorkerProfile, User).join(User, User.id == WorkerProfile.user_id)
        if verification_status:
            base = base.where(WorkerProfile.verification_status == verification_status)
        if tier:
            base = base.where(WorkerProfile.tier == tier)
        if skill:
            base = base.where(cast(WorkerProfile.skills, String).ilike(f'%"{skill}"%'))
        if status:
            base = base.where(User.status == status)
        if search:
            base = base.where(
                User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
            )

        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()

        result = await self.db.execute(
            base.order_by(WorkerProfile.created_at.desc())
            .limit(params.page_size)
            .offset(params.offset)
        )
        items = [_build_worker_out(user, wp) for wp, user in result.all()]
        return Page.create(items, total, params)

    async def get_worker(self, worker_id: UUID) -> AdminWorkerOut:
        wp = await self.db.get(WorkerProfile, worker_id)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")
        user = await self.db.get(User, wp.user_id)
        return _build_worker_out(user, wp)

    async def approve_worker(
        self,
        admin: User,
        worker_id: UUID,
        notes: str | None = None,
        ip: str | None = None,
    ) -> dict:
        wp = await self.db.get(WorkerProfile, worker_id)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")
        user = await self.db.get(User, wp.user_id)

        wp.verification_status = VerificationStatus.approved
        wp.approved_at = datetime.now(UTC)
        wp.approved_by = admin.id
        if notes:
            wp.admin_notes = notes
        if wp.tier == WorkerTier.newcomer:
            wp.tier = WorkerTier.verified
        user.status = UserStatus.active

        notif = Notification(
            user_id=user.id,
            title="Profile Approved!",
            body="Your worker profile has been approved. You can now apply to available jobs.",
            notification_type=NotificationType.verification,
        )
        self.db.add(notif)
        await self.audit.log_worker_approved(admin.id, wp.id, ip)
        await self.db.commit()
        return {"message": "Worker approved", "workerId": str(worker_id)}

    async def reject_worker(
        self,
        admin: User,
        worker_id: UUID,
        reason: str,
        ip: str | None = None,
    ) -> dict:
        wp = await self.db.get(WorkerProfile, worker_id)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")
        user = await self.db.get(User, wp.user_id)

        wp.verification_status = VerificationStatus.rejected
        user.status = UserStatus.rejected

        notif = Notification(
            user_id=user.id,
            title="Profile Not Approved",
            body=f"Your worker profile was not approved. Reason: {reason}",
            notification_type=NotificationType.verification,
        )
        self.db.add(notif)
        await self.audit.log_worker_rejected(admin.id, wp.id, reason, ip)
        await self.db.commit()
        return {"message": "Worker rejected", "workerId": str(worker_id)}

    async def flag_worker(
        self,
        admin: User,
        worker_id: UUID,
        reason: str,
        suspend: bool = False,
        ip: str | None = None,
    ) -> dict:
        wp = await self.db.get(WorkerProfile, worker_id)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")
        user = await self.db.get(User, wp.user_id)

        wp.verification_status = VerificationStatus.flagged
        if suspend:
            user.status = UserStatus.suspended

        await self.audit.log_worker_flagged(admin.id, wp.id, reason, ip)
        await self.db.commit()
        return {"message": "Worker flagged", "workerId": str(worker_id)}

    # ── Clients ────────────────────────────────────────────────

    async def create_client(
        self,
        admin: User,
        data: AdminClientCreateIn,
        ip: str | None = None,
    ) -> AdminClientOut:
        email = data.email.lower()
        existing = await self.users.get_by_email(email)
        if existing:
            raise AppError("Email already registered", 409, "email_exists")

        password = data.temporaryPassword or _generate_temp_password()
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=data.fullName,
            role=UserRole.client,
            is_email_verified=True,
        )
        self.db.add(user)
        await self.db.flush()

        cp = ClientProfile(
            user_id=user.id,
            company_name=data.companyName,
            contact_name=data.contactName,
            contact_email=email,
            contact_phone=data.contactPhone,
            country=data.country,
            billing_currency=data.billingCurrency,
        )
        self.db.add(cp)
        await self.db.flush()

        await self.audit.log_client_created(admin.id, cp.id, ip)
        await self.db.commit()
        return _build_client_out(user, cp)

    async def list_clients(
        self,
        params: PaginationParams,
        search: str | None = None,
    ) -> Page[AdminClientOut]:
        clients, total = await self.clients.list_all(search=search, limit=params.page_size, offset=params.offset)
        items = []
        for cp in clients:
            user = await self.db.get(User, cp.user_id)
            if user:
                items.append(_build_client_out(user, cp))
        return Page.create(items, total, params)

    async def get_client(self, client_id: UUID) -> AdminClientOut:
        cp = await self.db.get(ClientProfile, client_id)
        if not cp:
            raise AppError("Client not found", 404, "not_found")
        user = await self.db.get(User, cp.user_id)
        return _build_client_out(user, cp)

    # ── Client Jobs ────────────────────────────────────────────

    async def list_client_jobs(
        self,
        params: PaginationParams,
        client_id: UUID | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> Page[AdminClientJobOut]:
        jobs, total = await self.jobs.list_all(
            client_id=client_id,
            status=status,
            search=search,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            AdminClientJobOut(
                id=j.id,
                clientId=j.client_id,
                title=j.title,
                description=j.description,
                category=j.category.value,
                requiredSkills=j.required_skills or [],
                clientBudgetAmount=float(j.client_budget_amount) if j.client_budget_amount else None,
                clientBudgetCurrency=j.client_budget_currency.value,
                deadline=j.deadline,
                expectedTeamSize=j.expected_team_size,
                status=j.status.value,
                clientVisibleStatus=j.client_visible_status.value,
                confidentialNotes=j.confidential_notes,
                createdAt=j.created_at,
            )
            for j in jobs
        ]
        return Page.create(items, total, params)

    async def get_client_job(self, job_id: UUID) -> AdminClientJobOut:
        job = await self.db.get(ClientJob, job_id)
        if not job:
            raise AppError("Client job not found", 404, "not_found")
        return AdminClientJobOut(
            id=job.id,
            clientId=job.client_id,
            title=job.title,
            description=job.description,
            category=job.category.value,
            requiredSkills=job.required_skills or [],
            clientBudgetAmount=float(job.client_budget_amount) if job.client_budget_amount else None,
            clientBudgetCurrency=job.client_budget_currency.value,
            deadline=job.deadline,
            expectedTeamSize=job.expected_team_size,
            status=job.status.value,
            clientVisibleStatus=job.client_visible_status.value,
            confidentialNotes=job.confidential_notes,
            createdAt=job.created_at,
        )

    # ── Job Listings ───────────────────────────────────────────

    async def create_listing(
        self,
        admin: User,
        data: AdminJobListingCreateIn,
        ip: str | None = None,
    ) -> AdminJobListingOut:
        client_job = await self.db.get(ClientJob, data.clientJobId)
        if not client_job:
            raise AppError("Client job not found", 404, "not_found")

        listing = JobListing(
            client_job_id=data.clientJobId,
            title=data.title,
            public_description=data.publicDescription,
            category=data.category,
            required_skills=data.requiredSkills,
            worker_budget_amount=data.workerBudgetAmount,
            worker_budget_currency=data.workerBudgetCurrency,
            estimated_duration=data.estimatedDuration,
            application_deadline=data.applicationDeadline,
            openings=data.openings,
            listing_type=data.listingType,
            visibility=data.visibility,
            created_by=admin.id,
        )
        self.db.add(listing)
        await self.db.flush()

        client_job.status = ClientJobStatus.relisted
        await self.audit.log_listing_created(admin.id, listing.id, ip)
        await self.db.commit()
        return _build_listing_out(listing)

    async def publish_listing(
        self,
        admin: User,
        listing_id: UUID,
        ip: str | None = None,
    ) -> AdminJobListingOut:
        listing = await self.listings.publish(listing_id)
        if not listing:
            raise AppError("Listing not found", 404, "not_found")
        await self.audit.log_listing_published(admin.id, listing.id, ip)
        await self.db.commit()
        return _build_listing_out(listing)

    async def list_listings(
        self,
        params: PaginationParams,
        status: str | None = None,
        search: str | None = None,
    ) -> Page[AdminJobListingOut]:
        listings, total = await self.listings.list_all(
            status=JobListingStatus(status) if status else None,
            search=search,
            limit=params.page_size,
            offset=params.offset,
        )
        return Page.create([_build_listing_out(l) for l in listings], total, params)

    async def get_listing(self, listing_id: UUID) -> AdminJobListingOut:
        listing = await self.db.get(JobListing, listing_id)
        if not listing:
            raise AppError("Listing not found", 404, "not_found")
        return _build_listing_out(listing)

    # ── Applications ───────────────────────────────────────────

    async def list_applications(
        self,
        params: PaginationParams,
        listing_id: UUID | None = None,
        worker_id: UUID | None = None,
        status: str | None = None,
    ) -> Page[dict]:
        from app.db.enums import ApplicationStatus
        apps, total = await self.applications.list_all(
            listing_id=listing_id,
            worker_id=worker_id,
            status=ApplicationStatus(status) if status else None,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            {
                "id": str(a.id),
                "listingId": str(a.listing_id),
                "workerId": str(a.worker_id),
                "coverLetter": a.cover_letter,
                "proposedRateAmount": float(a.proposed_rate_amount) if a.proposed_rate_amount else None,
                "status": a.status.value,
                "adminScore": a.admin_score,
                "adminNotes": a.admin_notes,
                "appliedAt": a.applied_at.isoformat(),
            }
            for a in apps
        ]
        return Page.create(items, total, params)

    async def update_application_status(
        self,
        admin: User,
        application_id: UUID,
        data: ApplicationUpdateIn,
        ip: str | None = None,
    ) -> dict:
        app = await self.applications.update_status(
            application_id=application_id,
            status=data.status,
            admin_notes=data.adminNotes,
            admin_score=data.adminScore,
        )
        if not app:
            raise AppError("Application not found", 404, "not_found")
        await self.audit.log_application_status_updated(admin.id, application_id, data.status.value, ip)
        await self.db.commit()
        return {"message": "Application updated", "applicationId": str(application_id), "status": data.status.value}

    # ── Projects ───────────────────────────────────────────────

    async def create_project(
        self,
        admin: User,
        data: AdminProjectCreateIn,
        ip: str | None = None,
    ) -> AdminProjectOut:
        project = Project(
            client_job_id=data.clientJobId,
            listing_id=data.listingId,
            title=data.title,
            internal_description=data.internalDescription,
            client_visible_summary=data.clientVisibleSummary,
            due_date=data.dueDate,
            created_by=admin.id,
        )
        self.db.add(project)
        await self.db.flush()

        # Create default channels
        for ch_name, ch_type in [
            ("general", ChannelType.general),
            ("announcements", ChannelType.announcements),
            ("files", ChannelType.files),
        ]:
            await self.projects.create_channel(project.id, ch_name, ch_type)

        # Add members and notify
        for m in data.members:
            wp = await self.db.get(WorkerProfile, m.workerId)
            if not wp:
                continue
            await self.projects.add_member(
                project_id=project.id,
                worker_id=m.workerId,
                role=m.role.value,
                agreed_amount=m.agreedAmount,
                currency=m.agreedCurrency.value,
            )
            user = await self.db.get(User, wp.user_id)
            if user:
                notif = Notification(
                    user_id=user.id,
                    title="You've been assigned to a project!",
                    body=f'You have been added to project "{project.title}".',
                    notification_type=NotificationType.project,
                )
                self.db.add(notif)

        # Update client_job and listing status
        if data.clientJobId:
            cj = await self.db.get(ClientJob, data.clientJobId)
            if cj:
                cj.status = ClientJobStatus.in_progress
        if data.listingId:
            listing = await self.db.get(JobListing, data.listingId)
            if listing:
                listing.status = JobListingStatus.staffed

        # System message: project created
        await self.projects.create_system_message(
            project.id,
            f"Project \"{project.title}\" was created.",
            actor_id=admin.id,
        )
        await self.audit.log_project_created(admin.id, project.id, ip)
        await self.db.commit()

        return AdminProjectOut(
            id=project.id,
            clientJobId=project.client_job_id,
            listingId=project.listing_id,
            title=project.title,
            internalDescription=project.internal_description,
            clientVisibleSummary=project.client_visible_summary,
            status=project.status.value,
            startDate=project.start_date,
            dueDate=project.due_date,
            createdAt=project.created_at,
        )

    async def list_projects(
        self,
        params: PaginationParams,
        status: str | None = None,
    ) -> Page[AdminProjectOut]:
        from app.db.enums import ProjectStatus
        projects, total = await self.projects.list_all(
            status=ProjectStatus(status) if status else None,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            AdminProjectOut(
                id=p.id,
                clientJobId=p.client_job_id,
                listingId=p.listing_id,
                title=p.title,
                internalDescription=p.internal_description,
                clientVisibleSummary=p.client_visible_summary,
                status=p.status.value,
                startDate=p.start_date,
                dueDate=p.due_date,
                createdAt=p.created_at,
            )
            for p in projects
        ]
        return Page.create(items, total, params)

    async def get_project(self, project_id: UUID) -> AdminProjectOut:
        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")
        return AdminProjectOut(
            id=project.id,
            clientJobId=project.client_job_id,
            listingId=project.listing_id,
            title=project.title,
            internalDescription=project.internal_description,
            clientVisibleSummary=project.client_visible_summary,
            status=project.status.value,
            startDate=project.start_date,
            dueDate=project.due_date,
            createdAt=project.created_at,
        )

    async def add_project_member(
        self,
        admin: User,
        project_id: UUID,
        data: AdminProjectMemberAddIn,
        ip: str | None = None,
    ) -> dict:
        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")
        wp = await self.db.get(WorkerProfile, data.workerId)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")

        member = await self.projects.add_member(
            project_id=project_id,
            worker_id=data.workerId,
            role=data.role.value,
            agreed_amount=data.agreedAmount,
            currency=data.agreedCurrency.value,
        )
        await self.projects.create_system_message(
            project_id,
            "A new member was added to the project.",
            actor_id=admin.id,
        )
        await self.audit.log("project_member_added", actor_id=admin.id, entity_type="project",
                             entity_id=project_id, metadata={"worker_id": str(data.workerId)}, ip_address=ip)
        await self.db.commit()
        return {"message": "Member added", "memberId": str(member.id)}

    async def remove_project_member(
        self,
        admin: User,
        project_id: UUID,
        member_id: UUID,
        ip: str | None = None,
    ) -> dict:
        removed = await self.projects.remove_member(member_id)
        if not removed:
            raise AppError("Member not found", 404, "not_found")
        await self.projects.create_system_message(
            project_id,
            "A member was removed from the project.",
            actor_id=admin.id,
        )
        await self.audit.log("project_member_removed", actor_id=admin.id, entity_type="project",
                             entity_id=project_id, metadata={"member_id": str(member_id)}, ip_address=ip)
        await self.db.commit()
        return {"message": "Member removed", "memberId": str(member_id)}

    async def list_project_messages(
        self,
        project_id: UUID,
        params: PaginationParams,
        channel_id: UUID | None = None,
    ) -> Page[dict]:
        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")
        messages, total = await self.projects.list_messages(
            project_id=project_id,
            channel_id=channel_id,
            exclude_admin_private=False,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            {
                "id": str(m.id),
                "channelId": str(m.channel_id),
                "senderId": str(m.sender_id),
                "content": m.content,
                "messageType": m.message_type.value,
                "createdAt": m.created_at.isoformat(),
            }
            for m in messages
        ]
        return Page.create(items, total, params)

    async def send_project_message(
        self,
        admin: User,
        project_id: UUID,
        content: str,
        channel_id: UUID | None = None,
        ip: str | None = None,
    ) -> dict:
        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")

        if not channel_id:
            channel = await self.projects.get_first_general_channel(project_id)
            if not channel:
                raise AppError("No channel found", 404, "not_found")
            channel_id = channel.id

        msg = await self.projects.create_message(project_id, channel_id, admin.id, content)
        await self.audit.log_message_sent(admin.id, msg.id, project_id, ip)
        await self.db.commit()
        return {
            "id": str(msg.id),
            "channelId": str(msg.channel_id),
            "senderId": str(msg.sender_id),
            "content": msg.content,
            "createdAt": msg.created_at.isoformat(),
        }

    # ── Payments ───────────────────────────────────────────────

    async def list_payments(
        self,
        params: PaginationParams,
        status: str | None = None,
        direction: str | None = None,
        client_id: UUID | None = None,
        worker_id: UUID | None = None,
        project_id: UUID | None = None,
    ) -> Page[AdminPaymentOut]:
        from app.db.enums import PaymentDirection, PaymentStatus
        payments, total = await self.payments.list_all(
            status=PaymentStatus(status) if status else None,
            direction=PaymentDirection(direction) if direction else None,
            client_id=client_id,
            worker_id=worker_id,
            project_id=project_id,
            limit=params.page_size,
            offset=params.offset,
        )
        return Page.create([_build_payment_out(p) for p in payments], total, params)

    async def record_client_payment(
        self,
        admin: User,
        data: ClientPaymentCreateIn,
        ip: str | None = None,
    ) -> AdminPaymentOut:
        cp = await self.db.get(ClientProfile, data.clientId)
        if not cp:
            raise AppError("Client not found", 404, "not_found")

        payment = Payment(
            project_id=data.projectId,
            client_id=data.clientId,
            payer_type=PayerType.client,
            payee_type=PayeeType.bridgr,
            amount=data.amount,
            currency=data.currency,
            payment_direction=PaymentDirection.inbound_client_payment,
            payment_method=data.paymentMethod,
            status=PaymentStatus.received,
            transaction_reference=data.transactionReference,
            notes=data.notes,
            marked_by=admin.id,
            marked_at=datetime.now(UTC),
        )
        self.db.add(payment)
        await self.db.flush()
        await self.audit.log_payment_recorded(admin.id, payment.id, "inbound_client_payment", ip)
        await self.db.commit()
        return _build_payment_out(payment)

    async def record_worker_payout(
        self,
        admin: User,
        data: WorkerPayoutCreateIn,
        ip: str | None = None,
    ) -> AdminPaymentOut:
        wp = await self.db.get(WorkerProfile, data.workerId)
        if not wp:
            raise AppError("Worker not found", 404, "not_found")

        payment = Payment(
            project_id=data.projectId,
            milestone_id=data.milestoneId,
            worker_id=data.workerId,
            payer_type=PayerType.bridgr,
            payee_type=PayeeType.worker,
            amount=data.amount,
            currency=data.currency,
            payment_direction=PaymentDirection.outbound_worker_payout,
            payment_method=data.paymentMethod,
            status=PaymentStatus.paid,
            transaction_reference=data.transactionReference,
            notes=data.notes,
            marked_by=admin.id,
            marked_at=datetime.now(UTC),
        )
        self.db.add(payment)
        await self.db.flush()
        await self.audit.log_payment_recorded(admin.id, payment.id, "outbound_worker_payout", ip)
        await self.db.commit()
        return _build_payment_out(payment)

    async def update_payment_status(
        self,
        admin: User,
        payment_id: UUID,
        data: dict,
        ip: str | None = None,
    ) -> AdminPaymentOut:
        from app.db.enums import PaymentStatus as PS
        payment = await self.db.get(Payment, payment_id)
        if not payment:
            raise AppError("Payment not found", 404, "not_found")
        new_status = data.get("status")
        if new_status:
            payment.status = PS(new_status)
            payment.marked_by = admin.id
            payment.marked_at = datetime.now(UTC)
        if "notes" in data:
            payment.notes = data["notes"]
        await self.db.flush()
        await self.audit.log(
            "payment_status_updated",
            actor_id=admin.id,
            entity_type="payment",
            entity_id=payment_id,
            metadata={"status": new_status},
            ip_address=ip,
        )
        await self.db.commit()
        return _build_payment_out(payment)

    async def upload_project_file(
        self,
        admin: User,
        project_id: UUID,
        file_data: bytes,
        filename: str,
        content_type: str,
        channel_id: UUID | None = None,
        ip: str | None = None,
    ) -> dict:
        from app.services.upload_service import UploadService
        from app.db.enums import MessageType as MT

        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")

        svc = UploadService()
        svc.validate(content_type, len(file_data))

        key = svc.project_file_key(str(project_id), filename)
        url = await svc.upload(key, file_data, content_type)

        from app.db.models.project import Message
        if not channel_id:
            ch = await self.projects.get_first_general_channel(project_id)
            if not ch:
                raise AppError("No channel found", 404, "not_found")
            channel_id = ch.id

        msg = Message(
            project_id=project_id,
            channel_id=channel_id,
            sender_id=admin.id,
            content=filename,
            attachment_url=url,
            attachment_key=key,
            message_type=MT.file,
        )
        self.db.add(msg)
        await self.db.flush()
        await self.audit.log_message_sent(admin.id, msg.id, project_id, ip)
        await self.db.commit()
        return {"id": str(msg.id), "fileName": filename, "fileUrl": url, "key": key}

    async def margin_report(self) -> MarginReportOut:
        by_project = await self.payments.margin_report()
        total_client = sum(r["clientReceived"] for r in by_project)
        total_worker = sum(r["workerPaid"] for r in by_project)
        margin = total_client - total_worker
        margin_pct = round(margin / total_client * 100, 2) if total_client else 0
        return MarginReportOut(
            totalClientReceived=total_client,
            totalWorkerPayouts=total_worker,
            grossMargin=margin,
            marginPct=margin_pct,
            byProject=by_project,
        )

    # ── Audit Logs ─────────────────────────────────────────────

    async def list_audit_logs(
        self,
        params: PaginationParams,
        actor_user_id: UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> Page[AuditLogOut]:
        logs, total = await self.audit_repo.list_all(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            date_from=date_from,
            date_to=date_to,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            AuditLogOut(
                id=a.id,
                actorUserId=a.actor_user_id,
                action=a.action,
                entityType=a.entity_type,
                entityId=a.entity_id,
                metadata=a.log_metadata,
                ipAddress=a.ip_address,
                createdAt=a.created_at,
            )
            for a in logs
        ]
        return Page.create(items, total, params)

    # ── Notifications ──────────────────────────────────────────

    async def send_notification(
        self,
        admin: User,
        user_id: UUID | None,
        title: str,
        body: str,
        notification_type: NotificationType,
        role: str | None = None,
        ip: str | None = None,
    ) -> dict:
        count = 0
        if user_id:
            notif = Notification(
                user_id=user_id, title=title, body=body, notification_type=notification_type
            )
            self.db.add(notif)
            count = 1
        elif role:
            result = await self.db.execute(
                select(User).where(User.role == role, User.status == UserStatus.active)
            )
            users = list(result.scalars().all())
            for u in users:
                notif = Notification(
                    user_id=u.id, title=title, body=body, notification_type=notification_type
                )
                self.db.add(notif)
            count = len(users)

        await self.audit.log("admin_notification_sent", actor_id=admin.id,
                             metadata={"title": title, "count": count, "role": role}, ip_address=ip)
        await self.db.commit()
        return {"message": f"Notification sent to {count} user(s)"}


def _generate_temp_password() -> str:
    import secrets
    import string
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(16))
