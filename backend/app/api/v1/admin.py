from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile

from app.api.deps import DbSession, RequireAdmin
from app.schemas.admin import (
    AdminClientCreateIn,
    AdminJobListingCreateIn,
    AdminNotificationSendIn,
    AdminProjectCreateIn,
    AdminProjectMemberAddIn,
    ApplicationUpdateIn,
    ClientPaymentCreateIn,
    WorkerApproveIn,
    WorkerFlagIn,
    WorkerPayoutCreateIn,
    WorkerRejectIn,
)
from app.services.admin_service import AdminService
from app.utils.pagination import PaginationParams

router = APIRouter()


def _ip(request: Request) -> str:
    if fwd := request.headers.get("x-forwarded-for"):
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else ""


def _pagination(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


Pagination = Annotated[PaginationParams, Depends(_pagination)]


# ── Dashboard ──────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(admin: RequireAdmin, db: DbSession):
    return await AdminService(db).dashboard()


# ── Workers ────────────────────────────────────────────────────

@router.get("/workers")
async def list_workers(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    verification_status: str | None = Query(default=None, alias="verificationStatus"),
    tier: str | None = Query(default=None),
    skill: str | None = Query(default=None),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    return await AdminService(db).list_workers(
        params,
        verification_status=verification_status,
        tier=tier,
        skill=skill,
        search=search,
        status=status,
    )


@router.get("/workers/{worker_id}")
async def get_worker(admin: RequireAdmin, worker_id: UUID, db: DbSession):
    return await AdminService(db).get_worker(worker_id)


@router.post("/workers/{worker_id}/approve")
async def approve_worker(admin: RequireAdmin, worker_id: UUID, payload: WorkerApproveIn, request: Request, db: DbSession):
    return await AdminService(db).approve_worker(admin, worker_id, payload.notes, _ip(request))


@router.post("/workers/{worker_id}/reject")
async def reject_worker(admin: RequireAdmin, worker_id: UUID, payload: WorkerRejectIn, request: Request, db: DbSession):
    return await AdminService(db).reject_worker(admin, worker_id, payload.reason, _ip(request))


@router.post("/workers/{worker_id}/flag")
async def flag_worker(admin: RequireAdmin, worker_id: UUID, payload: WorkerFlagIn, request: Request, db: DbSession):
    return await AdminService(db).flag_worker(admin, worker_id, payload.reason, payload.suspend, _ip(request))


# ── Clients ────────────────────────────────────────────────────

@router.post("/clients")
async def create_client(admin: RequireAdmin, payload: AdminClientCreateIn, request: Request, db: DbSession):
    return await AdminService(db).create_client(admin, payload, _ip(request))


@router.get("/clients")
async def list_clients(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    search: str | None = Query(default=None),
):
    return await AdminService(db).list_clients(params, search=search)


@router.get("/clients/{client_id}")
async def get_client(admin: RequireAdmin, client_id: UUID, db: DbSession):
    return await AdminService(db).get_client(client_id)


# ── Client Jobs ────────────────────────────────────────────────

@router.get("/client-jobs")
async def list_client_jobs(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    client_id: UUID | None = Query(default=None, alias="clientId"),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    return await AdminService(db).list_client_jobs(params, client_id=client_id, status=status, search=search)


@router.get("/client-jobs/{job_id}")
async def get_client_job(admin: RequireAdmin, job_id: UUID, db: DbSession):
    return await AdminService(db).get_client_job(job_id)


# ── Job Listings ───────────────────────────────────────────────

@router.post("/job-listings")
async def create_listing(admin: RequireAdmin, payload: AdminJobListingCreateIn, request: Request, db: DbSession):
    return await AdminService(db).create_listing(admin, payload, _ip(request))


@router.post("/job-listings/{listing_id}/publish")
async def publish_listing(admin: RequireAdmin, listing_id: UUID, request: Request, db: DbSession):
    return await AdminService(db).publish_listing(admin, listing_id, _ip(request))


@router.get("/job-listings")
async def list_listings(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    return await AdminService(db).list_listings(params, status=status, search=search)


@router.get("/job-listings/{listing_id}")
async def get_listing(admin: RequireAdmin, listing_id: UUID, db: DbSession):
    return await AdminService(db).get_listing(listing_id)


# ── Applications ───────────────────────────────────────────────

@router.get("/applications")
async def list_applications(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    listing_id: UUID | None = Query(default=None, alias="listingId"),
    worker_id: UUID | None = Query(default=None, alias="workerId"),
    status: str | None = Query(default=None),
):
    return await AdminService(db).list_applications(params, listing_id=listing_id, worker_id=worker_id, status=status)


@router.post("/applications/{application_id}/status")
async def update_application_status(
    admin: RequireAdmin,
    application_id: UUID,
    payload: ApplicationUpdateIn,
    request: Request,
    db: DbSession,
):
    return await AdminService(db).update_application_status(admin, application_id, payload, _ip(request))


# ── Projects ───────────────────────────────────────────────────

@router.post("/projects")
async def create_project(admin: RequireAdmin, payload: AdminProjectCreateIn, request: Request, db: DbSession):
    return await AdminService(db).create_project(admin, payload, _ip(request))


@router.get("/projects")
async def list_projects(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    status: str | None = Query(default=None),
):
    return await AdminService(db).list_projects(params, status=status)


@router.get("/projects/{project_id}")
async def get_project(admin: RequireAdmin, project_id: UUID, db: DbSession):
    return await AdminService(db).get_project(project_id)


@router.post("/projects/{project_id}/members")
async def add_project_member(
    admin: RequireAdmin,
    project_id: UUID,
    payload: AdminProjectMemberAddIn,
    request: Request,
    db: DbSession,
):
    return await AdminService(db).add_project_member(admin, project_id, payload, _ip(request))


@router.delete("/projects/{project_id}/members/{member_id}")
async def remove_project_member(admin: RequireAdmin, project_id: UUID, member_id: UUID, request: Request, db: DbSession):
    return await AdminService(db).remove_project_member(admin, project_id, member_id, _ip(request))


@router.get("/projects/{project_id}/messages")
async def list_project_messages(
    admin: RequireAdmin,
    project_id: UUID,
    db: DbSession,
    params: Pagination,
    channel_id: UUID | None = Query(default=None, alias="channelId"),
):
    return await AdminService(db).list_project_messages(project_id, params, channel_id=channel_id)


@router.post("/projects/{project_id}/messages")
async def send_project_message(
    admin: RequireAdmin,
    project_id: UUID,
    payload: dict,
    request: Request,
    db: DbSession,
):
    content = payload.get("content", "")
    channel_id = payload.get("channelId")
    if channel_id:
        channel_id = UUID(channel_id)
    return await AdminService(db).send_project_message(admin, project_id, content, channel_id, _ip(request))


@router.post("/projects/{project_id}/files")
async def upload_project_file(
    admin: RequireAdmin,
    project_id: UUID,
    db: DbSession,
    request: Request,
    file: UploadFile = File(...),
    channel_id: UUID | None = Form(default=None, alias="channelId"),
):
    data = await file.read()
    return await AdminService(db).upload_project_file(
        admin,
        project_id=project_id,
        file_data=data,
        filename=file.filename or "file",
        content_type=file.content_type or "application/octet-stream",
        channel_id=channel_id,
        ip=_ip(request),
    )


# ── Payments ───────────────────────────────────────────────────

@router.get("/payments")
async def list_payments(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    status: str | None = Query(default=None),
    direction: str | None = Query(default=None),
    client_id: UUID | None = Query(default=None, alias="clientId"),
    worker_id: UUID | None = Query(default=None, alias="workerId"),
    project_id: UUID | None = Query(default=None, alias="projectId"),
):
    return await AdminService(db).list_payments(
        params, status=status, direction=direction,
        client_id=client_id, worker_id=worker_id, project_id=project_id,
    )


@router.post("/payments/client-received")
async def record_client_payment(admin: RequireAdmin, payload: ClientPaymentCreateIn, request: Request, db: DbSession):
    return await AdminService(db).record_client_payment(admin, payload, _ip(request))


@router.post("/payments/worker-payout")
async def record_worker_payout(admin: RequireAdmin, payload: WorkerPayoutCreateIn, request: Request, db: DbSession):
    return await AdminService(db).record_worker_payout(admin, payload, _ip(request))


@router.get("/payments/margin-report")
async def margin_report(admin: RequireAdmin, db: DbSession):
    return await AdminService(db).margin_report()


@router.post("/payments/{payment_id}/status")
async def update_payment_status(
    admin: RequireAdmin,
    payment_id: UUID,
    payload: dict,
    request: Request,
    db: DbSession,
):
    return await AdminService(db).update_payment_status(admin, payment_id, payload, _ip(request))


# ── Audit Logs ─────────────────────────────────────────────────

@router.get("/audit-logs")
async def list_audit_logs(
    admin: RequireAdmin,
    db: DbSession,
    params: Pagination,
    actor_user_id: UUID | None = Query(default=None, alias="actorUserId"),
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None, alias="entityType"),
    date_from: datetime | None = Query(default=None, alias="dateFrom"),
    date_to: datetime | None = Query(default=None, alias="dateTo"),
):
    return await AdminService(db).list_audit_logs(
        params,
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        date_from=date_from,
        date_to=date_to,
    )


# ── Notifications ──────────────────────────────────────────────

@router.post("/notifications")
async def send_notification(admin: RequireAdmin, payload: AdminNotificationSendIn, request: Request, db: DbSession):
    return await AdminService(db).send_notification(
        admin,
        user_id=payload.userId,
        title=payload.title,
        body=payload.body,
        notification_type=payload.notificationType,
        role=payload.role,
        ip=_ip(request),
    )
