from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.enums import DocumentType, ExperienceLevel, VerificationStatus
from app.db.models.user import User
from app.db.models.worker import WorkerDocument, WorkerProfile
from app.repositories.application_repo import ApplicationRepository
from app.repositories.job_repo import JobListingRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.worker_repo import WorkerRepository
from app.schemas.worker import (
    ApplicationCreateIn,
    ApplicationWorkerOut,
    ChannelOut,
    JobListingWorkerDetailOut,
    JobListingWorkerOut,
    MessageCreateIn,
    MessageOut,
    MilestoneWorkerOut,
    NotificationOut,
    TaskOut,
    WorkerDashboardOut,
    WorkerDocumentIn,
    WorkerDocumentOut,
    WorkerPaymentOut,
    WorkerProfileOut,
    WorkerProfileUpdateIn,
    WorkerProjectDetailOut,
    WorkerProjectOut,
)
from app.services.audit_service import AuditService
from app.utils.pagination import Page, PaginationParams


def _profile_completion(user: User, wp: WorkerProfile) -> int:
    score = 0
    if user.full_name:
        score += 10
    if user.phone:
        score += 10
    if wp.headline:
        score += 10
    if wp.bio:
        score += 15
    if wp.city:
        score += 5
    if wp.timezone:
        score += 5
    if wp.experience_level:
        score += 10
    if wp.skills:
        score += 20
    if wp.hourly_rate_min_inr:
        score += 10
    if wp.hourly_rate_max_inr:
        score += 5
    return min(score, 100)


def _build_profile(user: User, wp: WorkerProfile) -> WorkerProfileOut:
    return WorkerProfileOut(
        id=wp.id,
        userId=wp.user_id,
        fullName=user.full_name,
        email=user.email,
        phone=user.phone,
        headline=wp.headline,
        bio=wp.bio,
        city=wp.city,
        timezone=wp.timezone,
        experienceLevel=wp.experience_level.value if wp.experience_level else None,
        skills=wp.skills or [],
        hourlyRateMinInr=wp.hourly_rate_min_inr,
        hourlyRateMaxInr=wp.hourly_rate_max_inr,
        availability=wp.availability.value if wp.availability else None,
        verificationStatus=wp.verification_status.value,
        tier=wp.tier.value,
        trustScore=wp.trust_score,
        profileCompletionPct=_profile_completion(user, wp),
        createdAt=wp.created_at,
    )


def _build_listing_out(listing) -> JobListingWorkerOut:
    return JobListingWorkerOut(
        id=listing.id,
        title=listing.title,
        category=listing.category.value,
        requiredSkills=listing.required_skills or [],
        workerBudgetAmount=float(listing.worker_budget_amount),
        workerBudgetCurrency=listing.worker_budget_currency.value,
        estimatedDuration=listing.estimated_duration,
        applicationDeadline=listing.application_deadline,
        openings=listing.openings,
        listingType=listing.listing_type.value,
        publishedAt=listing.published_at,
    )


class WorkerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.workers = WorkerRepository(db)
        self.jobs = JobListingRepository(db)
        self.applications = ApplicationRepository(db)
        self.projects = ProjectRepository(db)
        self.payments = PaymentRepository(db)
        self.notifications = NotificationRepository(db)
        self.audit = AuditService(db)

    async def _get_worker(self, user: User) -> WorkerProfile:
        wp = await self.workers.get_by_user_id(user.id)
        if not wp:
            raise AppError("Worker profile not found", 404, "not_found")
        return wp

    # ── Dashboard ──────────────────────────────────────────────

    async def dashboard(self, user: User) -> WorkerDashboardOut:
        wp = await self._get_worker(user)

        available_jobs = await self.jobs.count_published()
        active_apps = await self.applications.count_active_by_worker(wp.id)
        active_projects = await self.projects.count_active_by_worker(wp.id)
        pending_payments = await self.payments.sum_pending_by_worker(wp.id)
        recent_notifs = await self.notifications.get_recent(user.id, limit=5)

        # Recommended: recent 5 published listings
        recommended_raw, _ = await self.jobs.list_published(limit=5, offset=0)
        recommended = [_build_listing_out(l) for l in recommended_raw]

        notif_out = [
            NotificationOut(
                id=n.id,
                title=n.title,
                body=n.body,
                notificationType=n.notification_type.value,
                isRead=n.is_read,
                createdAt=n.created_at,
                readAt=n.read_at,
            )
            for n in recent_notifs
        ]

        return WorkerDashboardOut(
            profileCompletionPct=_profile_completion(user, wp),
            verificationStatus=wp.verification_status.value,
            availableJobsCount=available_jobs,
            activeApplicationsCount=active_apps,
            activeProjectsCount=active_projects,
            pendingPaymentsAmount=pending_payments,
            recentNotifications=notif_out,
            recommendedJobs=recommended,
        )

    # ── Profile ────────────────────────────────────────────────

    async def get_profile(self, user: User) -> WorkerProfileOut:
        wp = await self._get_worker(user)
        return _build_profile(user, wp)

    async def update_profile(
        self,
        user: User,
        data: WorkerProfileUpdateIn,
        ip: str | None = None,
    ) -> WorkerProfileOut:
        wp = await self._get_worker(user)

        # Update User fields
        if data.fullName is not None:
            user.full_name = data.fullName
        if data.phone is not None:
            user.phone = data.phone

        # Update WorkerProfile fields
        if data.headline is not None:
            wp.headline = data.headline
        if data.bio is not None:
            wp.bio = data.bio
        if data.city is not None:
            wp.city = data.city
        if data.timezone is not None:
            wp.timezone = data.timezone
        if data.experienceLevel is not None:
            try:
                wp.experience_level = ExperienceLevel(data.experienceLevel.lower())
            except ValueError:
                raise AppError(f"Invalid experience level: {data.experienceLevel}", 422)
        if data.skills is not None:
            wp.skills = data.skills
        if data.hourlyRateMinInr is not None:
            wp.hourly_rate_min_inr = data.hourlyRateMinInr
        if data.hourlyRateMaxInr is not None:
            wp.hourly_rate_max_inr = data.hourlyRateMaxInr
        if data.availability is not None:
            wp.availability = data.availability

        await self.db.flush()
        await self.audit.log_worker_profile_updated(user.id, wp.id, ip)
        await self.db.commit()
        return _build_profile(user, wp)

    # ── Documents ──────────────────────────────────────────────

    async def upload_document(
        self,
        user: User,
        data: WorkerDocumentIn,
    ) -> WorkerDocumentOut:
        wp = await self._get_worker(user)
        try:
            doc_type = DocumentType(data.documentType)
        except ValueError:
            raise AppError(f"Invalid document type: {data.documentType}", 422)

        doc = WorkerDocument(
            worker_id=wp.id,
            document_type=doc_type,
            file_name=data.fileName,
            mime_type=data.mimeType,
            verification_status=VerificationStatus.pending,
        )
        await self.workers.add_document(doc)
        await self.db.commit()

        return WorkerDocumentOut(
            id=doc.id,
            documentType=doc.document_type.value,
            fileName=doc.file_name,
            fileUrl=doc.file_url,
            verificationStatus=doc.verification_status.value,
            uploadedAt=doc.uploaded_at,
        )

    async def upload_document_file(
        self,
        user: User,
        file_data: bytes,
        filename: str,
        content_type: str,
        document_type: str,
        ip: str | None = None,
    ) -> WorkerDocumentOut:
        from app.services.upload_service import UploadService

        wp = await self._get_worker(user)

        svc = UploadService()
        svc.validate(content_type, len(file_data))

        try:
            doc_type = DocumentType(document_type)
        except ValueError:
            raise AppError(f"Invalid document type: {document_type}", 422)

        key = svc.worker_document_key(str(wp.id), filename)
        url = await svc.upload(key, file_data, content_type)

        doc = WorkerDocument(
            worker_id=wp.id,
            document_type=doc_type,
            file_name=filename,
            file_url=url,
            file_key=key,
            mime_type=content_type,
            file_size=len(file_data),
            verification_status=VerificationStatus.pending,
        )
        await self.workers.add_document(doc)
        await self.audit.log(
            "document_uploaded",
            actor_id=user.id,
            entity_type="worker_document",
            entity_id=doc.id,
            metadata={"document_type": document_type, "file_name": filename},
            ip_address=ip,
        )
        await self.db.commit()

        return WorkerDocumentOut(
            id=doc.id,
            documentType=doc.document_type.value,
            fileName=doc.file_name,
            fileUrl=doc.file_url,
            verificationStatus=doc.verification_status.value,
            uploadedAt=doc.uploaded_at,
        )

    async def upload_project_file(
        self,
        user: User,
        project_id: UUID,
        file_data: bytes,
        filename: str,
        content_type: str,
        channel_id: UUID | None = None,
        ip: str | None = None,
    ) -> dict:
        from app.services.upload_service import UploadService
        from app.db.enums import MessageType as MT

        wp = await self._get_worker(user)
        if not await self.projects.get_member(project_id, wp.id):
            raise AppError("Project not found or access denied", 404, "not_found")

        svc = UploadService()
        svc.validate(content_type, len(file_data))

        key = svc.project_file_key(str(project_id), filename)
        url = await svc.upload(key, file_data, content_type)

        if not channel_id:
            ch = await self.projects.get_first_general_channel(project_id)
            if not ch:
                raise AppError("No default channel found", 404, "not_found")
            channel_id = ch.id

        from app.db.models.project import Message
        msg = Message(
            project_id=project_id,
            channel_id=channel_id,
            sender_id=user.id,
            content=filename,
            attachment_url=url,
            attachment_key=key,
            message_type=MT.file,
        )
        self.db.add(msg)
        await self.db.flush()
        await self.audit.log_message_sent(user.id, msg.id, project_id, ip)
        await self.db.commit()

        return {"id": str(msg.id), "fileName": filename, "fileUrl": url, "key": key}

    # ── Jobs ───────────────────────────────────────────────────

    async def list_jobs(
        self,
        params: PaginationParams,
        skill: str | None = None,
        category: str | None = None,
        budget_min: float | None = None,
        search: str | None = None,
    ) -> Page[JobListingWorkerOut]:
        listings, total = await self.jobs.list_published(
            skill=skill,
            category=category,
            budget_min=budget_min,
            search=search,
            limit=params.page_size,
            offset=params.offset,
        )
        return Page.create([_build_listing_out(l) for l in listings], total, params)

    async def get_job(self, listing_id: UUID) -> JobListingWorkerDetailOut:
        listing = await self.jobs.get_published(listing_id)
        if not listing:
            raise AppError("Job listing not found", 404, "not_found")
        out = _build_listing_out(listing)
        return JobListingWorkerDetailOut(**out.model_dump(), publicDescription=listing.public_description)

    # ── Applications ───────────────────────────────────────────

    async def apply_to_job(
        self,
        user: User,
        listing_id: UUID,
        data: ApplicationCreateIn,
        ip: str | None = None,
    ) -> ApplicationWorkerOut:
        wp = await self._get_worker(user)

        listing = await self.jobs.get_published(listing_id)
        if not listing:
            raise AppError("Job listing not found", 404, "not_found")

        existing = await self.applications.get_by_listing_and_worker(listing_id, wp.id)
        if existing:
            raise AppError("You have already applied to this listing", 409, "already_applied")

        application = await self.applications.create(
            listing_id=listing_id,
            worker_id=wp.id,
            cover_letter=data.coverLetter,
            proposed_rate=data.proposedRateAmount,
        )
        await self.audit.log_application_created(user.id, application.id, listing_id, ip)
        await self.db.commit()

        return ApplicationWorkerOut(
            id=application.id,
            listingId=listing_id,
            listingTitle=listing.title,
            status=application.status.value,
            appliedAt=application.applied_at,
            coverLetter=application.cover_letter,
        )

    async def list_applications(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[ApplicationWorkerOut]:
        wp = await self._get_worker(user)
        rows, total = await self.applications.list_by_worker(
            worker_id=wp.id,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            ApplicationWorkerOut(
                id=app.id,
                listingId=app.listing_id,
                listingTitle=title,
                status=app.status.value,
                appliedAt=app.applied_at,
                coverLetter=app.cover_letter,
            )
            for app, title in rows
        ]
        return Page.create(items, total, params)

    # ── Projects ───────────────────────────────────────────────

    async def list_projects(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[WorkerProjectOut]:
        wp = await self._get_worker(user)
        rows, total = await self.projects.list_by_worker(
            worker_id=wp.id,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            WorkerProjectOut(
                id=project.id,
                title=project.title,
                status=project.status.value,
                role=member.role.value,
                agreedAmount=float(member.agreed_amount),
                agreedCurrency=member.agreed_currency.value,
                startDate=project.start_date,
                dueDate=project.due_date,
                createdAt=project.created_at,
            )
            for project, member in rows
        ]
        return Page.create(items, total, params)

    async def get_project(self, user: User, project_id: UUID) -> WorkerProjectDetailOut:
        wp = await self._get_worker(user)
        member = await self.projects.get_member(project_id, wp.id)
        if not member:
            raise AppError("Project not found or access denied", 404, "not_found")

        from app.db.models.project import Project
        project = await self.db.get(Project, project_id)
        if not project:
            raise AppError("Project not found", 404, "not_found")

        milestones_raw = await self.projects.get_milestones(project_id)
        tasks_raw = await self.projects.get_tasks(project_id, assigned_to=wp.id)
        channels_raw = await self.projects.get_channels(project_id, exclude_admin_private=True)

        milestones = [
            MilestoneWorkerOut(
                id=m.id,
                title=m.title,
                workerAmount=float(m.worker_amount),
                currency=m.currency.value,
                status=m.status.value,
                dueDate=m.due_date,
            )
            for m in milestones_raw
        ]
        tasks = [
            TaskOut(id=t.id, title=t.title, description=t.description, status=t.status.value, dueDate=t.due_date)
            for t in tasks_raw
        ]
        channels = [
            ChannelOut(id=c.id, name=c.name, channelType=c.channel_type.value)
            for c in channels_raw
        ]

        return WorkerProjectDetailOut(
            id=project.id,
            title=project.title,
            status=project.status.value,
            role=member.role.value,
            agreedAmount=float(member.agreed_amount),
            agreedCurrency=member.agreed_currency.value,
            startDate=project.start_date,
            dueDate=project.due_date,
            createdAt=project.created_at,
            milestones=milestones,
            tasks=tasks,
            channels=channels,
        )

    # ── Messages ───────────────────────────────────────────────

    async def list_messages(
        self,
        user: User,
        project_id: UUID,
        params: PaginationParams,
        channel_id: UUID | None = None,
    ) -> Page[MessageOut]:
        wp = await self._get_worker(user)
        if not await self.projects.get_member(project_id, wp.id):
            raise AppError("Project not found or access denied", 404, "not_found")

        messages, total = await self.projects.list_messages(
            project_id=project_id,
            channel_id=channel_id,
            exclude_admin_private=True,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            MessageOut(
                id=m.id,
                channelId=m.channel_id,
                senderId=m.sender_id,
                content=m.content,
                messageType=m.message_type.value,
                createdAt=m.created_at,
            )
            for m in messages
        ]
        return Page.create(items, total, params)

    async def send_message(
        self,
        user: User,
        project_id: UUID,
        data: MessageCreateIn,
        ip: str | None = None,
    ) -> MessageOut:
        wp = await self._get_worker(user)
        if not await self.projects.get_member(project_id, wp.id):
            raise AppError("Project not found or access denied", 404, "not_found")

        if data.channelId:
            # Verify channel belongs to project and is not admin_private
            channels = await self.projects.get_channels(project_id, exclude_admin_private=True)
            channel_ids = {c.id for c in channels}
            if data.channelId not in channel_ids:
                raise AppError("Channel not found or access denied", 403, "forbidden")
            channel_id = data.channelId
        else:
            channel = await self.projects.get_first_general_channel(project_id)
            if not channel:
                raise AppError("No default channel found for this project", 404, "not_found")
            channel_id = channel.id

        msg = await self.projects.create_message(
            project_id=project_id,
            channel_id=channel_id,
            sender_id=user.id,
            content=data.content,
        )
        await self.audit.log_message_sent(user.id, msg.id, project_id, ip)
        await self.db.commit()

        return MessageOut(
            id=msg.id,
            channelId=msg.channel_id,
            senderId=msg.sender_id,
            content=msg.content,
            messageType=msg.message_type.value,
            createdAt=msg.created_at,
        )

    # ── Payments ───────────────────────────────────────────────

    async def list_payments(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[WorkerPaymentOut]:
        wp = await self._get_worker(user)
        payments, total = await self.payments.list_by_worker(
            worker_id=wp.id,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            WorkerPaymentOut(
                id=p.id,
                projectId=p.project_id,
                amount=float(p.amount),
                currency=p.currency.value,
                status=p.status.value,
                paymentMethod=p.payment_method.value,
                transactionReference=p.transaction_reference,
                notes=p.notes,
                createdAt=p.created_at,
            )
            for p in payments
        ]
        return Page.create(items, total, params)

    # ── Notifications ──────────────────────────────────────────

    async def list_notifications(
        self,
        user: User,
        params: PaginationParams,
    ) -> Page[NotificationOut]:
        notifs, total = await self.notifications.list_by_user(
            user_id=user.id,
            limit=params.page_size,
            offset=params.offset,
        )
        items = [
            NotificationOut(
                id=n.id,
                title=n.title,
                body=n.body,
                notificationType=n.notification_type.value,
                isRead=n.is_read,
                createdAt=n.created_at,
                readAt=n.read_at,
            )
            for n in notifs
        ]
        return Page.create(items, total, params)

    async def mark_notification_read(
        self,
        user: User,
        notification_id: UUID,
    ) -> NotificationOut:
        notif = await self.notifications.mark_read(notification_id, user.id)
        if not notif:
            raise AppError("Notification not found", 404, "not_found")
        await self.db.commit()
        return NotificationOut(
            id=notif.id,
            title=notif.title,
            body=notif.body,
            notificationType=notif.notification_type.value,
            isRead=notif.is_read,
            createdAt=notif.created_at,
            readAt=notif.read_at,
        )
