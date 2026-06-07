from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        action: str,
        actor_id: UUID | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        metadata: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            actor_user_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            log_metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    # ── Auth events ────────────────────────────────────────────

    async def log_login_success(self, user_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("login_success", actor_id=user_id, entity_type="user",
                              entity_id=user_id, ip_address=ip_address)

    async def log_login_failure(self, email: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("login_failure", metadata={"email": email}, ip_address=ip_address)

    async def log_logout(self, user_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("logout", actor_id=user_id, entity_type="user",
                              entity_id=user_id, ip_address=ip_address)

    async def log_token_refresh_failure(self, ip_address: str | None = None) -> AuditLog:
        return await self.log("token_refresh_failure", ip_address=ip_address)

    async def log_email_verification(self, user_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("email_verified", actor_id=user_id, entity_type="user",
                              entity_id=user_id, ip_address=ip_address)

    async def log_password_reset_request(self, user_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("password_reset_request", actor_id=user_id, entity_type="user",
                              entity_id=user_id, ip_address=ip_address)

    async def log_password_reset_success(self, user_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("password_reset_success", actor_id=user_id, entity_type="user",
                              entity_id=user_id, ip_address=ip_address)

    async def log_worker_registration(self, user_id: UUID, email: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("worker_registration", actor_id=user_id, entity_type="user",
                              entity_id=user_id, metadata={"email": email}, ip_address=ip_address)

    # ── Worker events ──────────────────────────────────────────

    async def log_worker_profile_updated(self, user_id: UUID, worker_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("worker_profile_updated", actor_id=user_id, entity_type="worker_profile",
                              entity_id=worker_id, ip_address=ip_address)

    async def log_application_created(self, user_id: UUID, application_id: UUID, listing_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("application_created", actor_id=user_id, entity_type="application",
                              entity_id=application_id, metadata={"listing_id": str(listing_id)},
                              ip_address=ip_address)

    async def log_message_sent(self, user_id: UUID, message_id: UUID, project_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("message_sent", actor_id=user_id, entity_type="message",
                              entity_id=message_id, metadata={"project_id": str(project_id)},
                              ip_address=ip_address)

    # ── Client events ──────────────────────────────────────────

    async def log_client_profile_updated(self, user_id: UUID, client_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("client_profile_updated", actor_id=user_id, entity_type="client_profile",
                              entity_id=client_id, ip_address=ip_address)

    async def log_client_job_submitted(self, user_id: UUID, job_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("client_job_submitted", actor_id=user_id, entity_type="client_job",
                              entity_id=job_id, ip_address=ip_address)

    async def log_support_ticket(self, user_id: UUID, metadata: dict, ip_address: str | None = None) -> AuditLog:
        return await self.log("support_ticket_created", actor_id=user_id, metadata=metadata,
                              ip_address=ip_address)

    # ── Admin events ───────────────────────────────────────────

    async def log_worker_approved(self, admin_id: UUID, worker_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("worker_approved", actor_id=admin_id, entity_type="worker_profile",
                              entity_id=worker_id, ip_address=ip_address)

    async def log_worker_rejected(self, admin_id: UUID, worker_id: UUID, reason: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("worker_rejected", actor_id=admin_id, entity_type="worker_profile",
                              entity_id=worker_id, metadata={"reason": reason}, ip_address=ip_address)

    async def log_worker_flagged(self, admin_id: UUID, worker_id: UUID, reason: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("worker_flagged", actor_id=admin_id, entity_type="worker_profile",
                              entity_id=worker_id, metadata={"reason": reason}, ip_address=ip_address)

    async def log_client_created(self, admin_id: UUID, client_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("client_created", actor_id=admin_id, entity_type="client_profile",
                              entity_id=client_id, ip_address=ip_address)

    async def log_listing_created(self, admin_id: UUID, listing_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("listing_created", actor_id=admin_id, entity_type="job_listing",
                              entity_id=listing_id, ip_address=ip_address)

    async def log_listing_published(self, admin_id: UUID, listing_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("listing_published", actor_id=admin_id, entity_type="job_listing",
                              entity_id=listing_id, ip_address=ip_address)

    async def log_application_status_updated(self, admin_id: UUID, application_id: UUID, status: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("application_status_updated", actor_id=admin_id, entity_type="application",
                              entity_id=application_id, metadata={"status": status}, ip_address=ip_address)

    async def log_project_created(self, admin_id: UUID, project_id: UUID, ip_address: str | None = None) -> AuditLog:
        return await self.log("project_created", actor_id=admin_id, entity_type="project",
                              entity_id=project_id, ip_address=ip_address)

    async def log_payment_recorded(self, admin_id: UUID, payment_id: UUID, direction: str, ip_address: str | None = None) -> AuditLog:
        return await self.log("payment_recorded", actor_id=admin_id, entity_type="payment",
                              entity_id=payment_id, metadata={"direction": direction}, ip_address=ip_address)
