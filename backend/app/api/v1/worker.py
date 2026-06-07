from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile

from app.api.deps import DbSession, RequireWorker
from app.schemas.worker import (
    ApplicationCreateIn,
    MessageCreateIn,
    WorkerDocumentIn,
    WorkerProfileUpdateIn,
)
from app.services.worker_service import WorkerService
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
async def dashboard(user: RequireWorker, db: DbSession):
    return await WorkerService(db).dashboard(user)


# ── Profile ────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(user: RequireWorker, db: DbSession):
    return await WorkerService(db).get_profile(user)


@router.patch("/profile")
async def update_profile(user: RequireWorker, payload: WorkerProfileUpdateIn, request: Request, db: DbSession):
    return await WorkerService(db).update_profile(user, payload, _ip(request))


# ── Documents ──────────────────────────────────────────────────

@router.post("/documents")
async def upload_document(user: RequireWorker, payload: WorkerDocumentIn, db: DbSession):
    return await WorkerService(db).upload_document(user, payload)


@router.post("/documents/upload")
async def upload_document_file(
    user: RequireWorker,
    db: DbSession,
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form(default="resume", alias="documentType"),
):
    data = await file.read()
    return await WorkerService(db).upload_document_file(
        user,
        file_data=data,
        filename=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        document_type=document_type,
        ip=_ip(request),
    )


# ── Job Listings ───────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(
    user: RequireWorker,
    db: DbSession,
    params: Pagination,
    skill: str | None = Query(default=None),
    category: str | None = Query(default=None),
    budget_min: float | None = Query(default=None, alias="budgetMin"),
    search: str | None = Query(default=None),
):
    return await WorkerService(db).list_jobs(params, skill=skill, category=category, budget_min=budget_min, search=search)


@router.get("/jobs/{listing_id}")
async def get_job(user: RequireWorker, listing_id: UUID, db: DbSession):
    return await WorkerService(db).get_job(listing_id)


# ── Applications ───────────────────────────────────────────────

@router.post("/jobs/{listing_id}/apply")
async def apply_to_job(
    user: RequireWorker,
    listing_id: UUID,
    payload: ApplicationCreateIn,
    request: Request,
    db: DbSession,
):
    return await WorkerService(db).apply_to_job(user, listing_id, payload, _ip(request))


@router.get("/applications")
async def list_applications(user: RequireWorker, db: DbSession, params: Pagination):
    return await WorkerService(db).list_applications(user, params)


# ── Projects ───────────────────────────────────────────────────

@router.get("/projects")
async def list_projects(user: RequireWorker, db: DbSession, params: Pagination):
    return await WorkerService(db).list_projects(user, params)


@router.get("/projects/{project_id}")
async def get_project(user: RequireWorker, project_id: UUID, db: DbSession):
    return await WorkerService(db).get_project(user, project_id)


@router.get("/projects/{project_id}/messages")
async def list_messages(
    user: RequireWorker,
    project_id: UUID,
    db: DbSession,
    params: Pagination,
    channel_id: UUID | None = Query(default=None, alias="channelId"),
):
    return await WorkerService(db).list_messages(user, project_id, params, channel_id=channel_id)


@router.post("/projects/{project_id}/messages")
async def send_message(
    user: RequireWorker,
    project_id: UUID,
    payload: MessageCreateIn,
    request: Request,
    db: DbSession,
):
    return await WorkerService(db).send_message(user, project_id, payload, _ip(request))


@router.post("/projects/{project_id}/files")
async def upload_project_file(
    user: RequireWorker,
    project_id: UUID,
    db: DbSession,
    request: Request,
    file: UploadFile = File(...),
    channel_id: UUID | None = Form(default=None, alias="channelId"),
):
    data = await file.read()
    return await WorkerService(db).upload_project_file(
        user,
        project_id=project_id,
        file_data=data,
        filename=file.filename or "file",
        content_type=file.content_type or "application/octet-stream",
        channel_id=channel_id,
        ip=_ip(request),
    )


# ── Payments ───────────────────────────────────────────────────

@router.get("/payments")
async def list_payments(user: RequireWorker, db: DbSession, params: Pagination):
    return await WorkerService(db).list_payments(user, params)


# ── Notifications ──────────────────────────────────────────────

@router.get("/notifications")
async def list_notifications(user: RequireWorker, db: DbSession, params: Pagination):
    return await WorkerService(db).list_notifications(user, params)


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(user: RequireWorker, notification_id: UUID, db: DbSession):
    return await WorkerService(db).mark_notification_read(user, notification_id)
