"""Role protection tests — verify HTTP 403 for cross-role endpoint access."""

from httpx import AsyncClient

from app.core.security import create_access_token
from app.db.models.project import Project
from app.db.models.user import User


def auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(str(user.id), claims={'role': user.role.value})}"}


# ── Worker cannot hit admin endpoints ─────────────────────────

async def test_worker_cannot_hit_admin_dashboard(client: AsyncClient, worker_user: User):
    resp = await client.get("/api/v1/admin/dashboard", headers=auth_headers(worker_user))
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"


async def test_worker_cannot_hit_admin_workers_list(client: AsyncClient, worker_user: User):
    resp = await client.get("/api/v1/admin/workers", headers=auth_headers(worker_user))
    assert resp.status_code == 403


async def test_worker_cannot_hit_admin_payments(client: AsyncClient, worker_user: User):
    resp = await client.get("/api/v1/admin/payments", headers=auth_headers(worker_user))
    assert resp.status_code == 403


async def test_worker_cannot_create_admin_project(client: AsyncClient, worker_user: User):
    resp = await client.post(
        "/api/v1/admin/projects",
        json={"title": "Hack", "internalDescription": ""},
        headers=auth_headers(worker_user),
    )
    assert resp.status_code == 403


# ── Client cannot hit admin endpoints ─────────────────────────

async def test_client_cannot_hit_admin_dashboard(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/admin/dashboard", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_admin_workers_list(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/admin/workers", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_admin_payments(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/admin/payments", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_admin_project(
    client: AsyncClient, client_user: User, project: Project
):
    resp = await client.get(
        f"/api/v1/admin/projects/{project.id}",
        headers=auth_headers(client_user),
    )
    assert resp.status_code == 403


# ── Worker cannot hit client endpoints ────────────────────────

async def test_worker_cannot_hit_client_projects(client: AsyncClient, worker_user: User):
    resp = await client.get("/api/v1/client/projects", headers=auth_headers(worker_user))
    assert resp.status_code == 403


async def test_worker_cannot_hit_client_payments(client: AsyncClient, worker_user: User):
    resp = await client.get("/api/v1/client/payments", headers=auth_headers(worker_user))
    assert resp.status_code == 403


# ── Client cannot hit worker endpoints ────────────────────────

async def test_client_cannot_hit_worker_dashboard(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/worker/dashboard", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_worker_jobs(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/worker/jobs", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_worker_payments(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/worker/payments", headers=auth_headers(client_user))
    assert resp.status_code == 403


async def test_client_cannot_hit_worker_projects(client: AsyncClient, client_user: User):
    resp = await client.get("/api/v1/worker/projects", headers=auth_headers(client_user))
    assert resp.status_code == 403


# ── Unauthenticated requests are rejected ─────────────────────

async def test_no_token_admin(client: AsyncClient):
    resp = await client.get("/api/v1/admin/dashboard")
    assert resp.status_code in (401, 403)


async def test_no_token_worker(client: AsyncClient):
    resp = await client.get("/api/v1/worker/dashboard")
    assert resp.status_code in (401, 403)


async def test_no_token_client(client: AsyncClient):
    resp = await client.get("/api/v1/client/projects")
    assert resp.status_code in (401, 403)
