from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import DbSession, RequireClient
from app.schemas.client import ClientJobCreateIn, ClientProfileUpdateIn, SupportTicketIn
from app.services.client_service import ClientService
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
async def dashboard(user: RequireClient, db: DbSession):
    return await ClientService(db).dashboard(user)


# ── Profile ────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(user: RequireClient, db: DbSession):
    return await ClientService(db).get_profile(user)


@router.patch("/profile")
async def update_profile(user: RequireClient, payload: ClientProfileUpdateIn, request: Request, db: DbSession):
    return await ClientService(db).update_profile(user, payload, _ip(request))


# ── Jobs ───────────────────────────────────────────────────────

@router.post("/jobs")
async def submit_job(user: RequireClient, payload: ClientJobCreateIn, request: Request, db: DbSession):
    return await ClientService(db).submit_job(user, payload, _ip(request))


@router.get("/jobs")
async def list_jobs(
    user: RequireClient,
    db: DbSession,
    params: Pagination,
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    return await ClientService(db).list_jobs(user, params, search=search, status=status)


@router.get("/jobs/{job_id}")
async def get_job(user: RequireClient, job_id: UUID, db: DbSession):
    return await ClientService(db).get_job(user, job_id)


# ── Projects ───────────────────────────────────────────────────

@router.get("/projects")
async def list_projects(user: RequireClient, db: DbSession, params: Pagination):
    return await ClientService(db).list_projects(user, params)


@router.get("/projects/{project_id}")
async def get_project(user: RequireClient, project_id: UUID, db: DbSession):
    return await ClientService(db).get_project(user, project_id)


# ── Payments ───────────────────────────────────────────────────

@router.get("/payments")
async def list_payments(user: RequireClient, db: DbSession, params: Pagination):
    return await ClientService(db).list_payments(user, params)


# ── Support ────────────────────────────────────────────────────

@router.post("/support")
async def create_support_ticket(user: RequireClient, payload: SupportTicketIn, request: Request, db: DbSession):
    return await ClientService(db).create_support_ticket(user, payload, _ip(request))
