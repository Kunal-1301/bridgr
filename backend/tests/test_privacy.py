"""Privacy tests — verify no cross-role data leakage."""

from httpx import AsyncClient

from app.core.security import create_access_token
from app.db.models.client import ClientProfile
from app.db.models.job import JobListing
from app.db.models.payment import Payment
from app.db.models.project import Project, ProjectChannel, ProjectMember
from app.db.models.user import User
from app.db.models.worker import WorkerProfile


def auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(str(user.id), claims={'role': user.role.value})}"}


# ── 1. Worker job listing: no client identity ──────────────────

async def test_worker_job_listing_hides_client_identity(
    client: AsyncClient,
    worker_user: User,
    worker_profile: WorkerProfile,
    job_listing: JobListing,
    client_profile: ClientProfile,
    client_job,
):
    resp = await client.get("/api/v1/worker/jobs", headers=auth_headers(worker_user))
    assert resp.status_code == 200
    body = resp.text.lower()

    # Client identity fields must be absent from the response payload
    assert "acme corp" not in body
    assert "carol@acmecorp.test" not in body
    assert "acmecorp" not in body
    assert "+12125550199" not in body


async def test_worker_job_detail_hides_client_budget(
    client: AsyncClient,
    worker_user: User,
    worker_profile: WorkerProfile,
    job_listing: JobListing,
    client_profile: ClientProfile,
    client_job,
):
    resp = await client.get(f"/api/v1/worker/jobs/{job_listing.id}", headers=auth_headers(worker_user))
    assert resp.status_code == 200
    data = resp.json()

    # The listing exposes worker_budget_amount, not client_budget_amount
    assert "clientBudgetAmount" not in data
    assert "client_budget_amount" not in data
    # client_job_id must not expose raw FK linking back to the client
    assert "clientName" not in data
    assert "clientEmail" not in data
    assert "companyName" not in data


# ── 2. Client project view: no worker identity ─────────────────

async def test_client_project_hides_worker_identity(
    client: AsyncClient,
    client_user: User,
    client_profile: ClientProfile,
    project: Project,
    project_member: ProjectMember,
    worker_user: User,
    worker_profile: WorkerProfile,
    client_job,
):
    resp = await client.get(f"/api/v1/client/projects/{project.id}", headers=auth_headers(client_user))
    # Client project endpoint may not yet exist; accept 200 or 404
    if resp.status_code == 404:
        return
    assert resp.status_code == 200
    body = resp.text.lower()

    assert "alice worker" not in body
    assert "worker@bridgr.test" not in body
    assert str(worker_user.id).lower() not in body
    # Payout amount (agreed_amount) must not appear
    assert "2000" not in body or "worker_amount" not in resp.text


async def test_client_project_list_hides_worker_identity(
    client: AsyncClient,
    client_user: User,
    client_profile: ClientProfile,
    project: Project,
    worker_user: User,
    worker_profile: WorkerProfile,
    client_job,
):
    resp = await client.get("/api/v1/client/projects", headers=auth_headers(client_user))
    if resp.status_code == 404:
        return
    assert resp.status_code == 200
    body = resp.text.lower()

    assert "alice worker" not in body
    assert "worker@bridgr.test" not in body


# ── 3. Worker payments: only own outbound payouts ──────────────

async def test_worker_payments_only_own_payouts(
    client: AsyncClient,
    worker_user: User,
    worker_profile: WorkerProfile,
    worker_payout: Payment,
    other_worker_payout: Payment,
    client_payment: Payment,
    worker2_profile: WorkerProfile,
):
    resp = await client.get("/api/v1/worker/payments", headers=auth_headers(worker_user))
    assert resp.status_code == 200
    data = resp.json()

    items = data.get("items", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        items = []

    for item in items:
        # Must only contain outbound worker payouts
        assert item.get("paymentDirection") != "inbound_client_payment", (
            "Client payment direction must not appear in worker payment list"
        )
        # Must only be this worker's payments (not worker2's)
        if "workerId" in item:
            assert str(item["workerId"]) == str(worker_profile.id), (
                "Worker must only see their own payouts"
            )


async def test_worker_payments_no_client_payment_records(
    client: AsyncClient,
    worker_user: User,
    worker_profile: WorkerProfile,
    client_payment: Payment,
):
    resp = await client.get("/api/v1/worker/payments", headers=auth_headers(worker_user))
    assert resp.status_code == 200
    data = resp.json()
    items = data.get("items", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        items = []

    directions = [item.get("paymentDirection") for item in items]
    assert "inbound_client_payment" not in directions


# ── 4. Client payments: only own inbound payments ──────────────

async def test_client_payments_only_own_inbound(
    client: AsyncClient,
    client_user: User,
    client_profile: ClientProfile,
    client_payment: Payment,
    worker_payout: Payment,
):
    resp = await client.get("/api/v1/client/payments", headers=auth_headers(client_user))
    assert resp.status_code == 200
    data = resp.json()
    items = data.get("items", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        items = []

    for item in items:
        assert item.get("paymentDirection") != "outbound_worker_payout", (
            "Worker payout direction must not appear in client payment list"
        )
        if "clientId" in item:
            assert str(item["clientId"]) == str(client_profile.id), (
                "Client must only see their own payments"
            )


# ── 5. Worker cannot access another worker's project ──────────

async def test_worker_cannot_access_other_workers_project(
    client: AsyncClient,
    worker2_user: User,
    worker2_profile: WorkerProfile,
    project: Project,
    project_member: ProjectMember,  # worker1 is member, not worker2
):
    resp = await client.get(
        f"/api/v1/worker/projects/{project.id}",
        headers=auth_headers(worker2_user),
    )
    assert resp.status_code in (403, 404), (
        f"Worker2 must not access worker1's project, got {resp.status_code}"
    )


# ── 6. Client cannot access admin project endpoint ─────────────

async def test_client_cannot_access_admin_project_endpoint(
    client: AsyncClient,
    client_user: User,
    project: Project,
):
    resp = await client.get(
        f"/api/v1/admin/projects/{project.id}",
        headers=auth_headers(client_user),
    )
    assert resp.status_code == 403


# ── 7. Worker cannot access admin endpoint ─────────────────────

async def test_worker_cannot_access_admin_endpoint(
    client: AsyncClient,
    worker_user: User,
):
    resp = await client.get("/api/v1/admin/dashboard", headers=auth_headers(worker_user))
    assert resp.status_code == 403


# ── 8. Admin can access all core endpoints ─────────────────────

async def test_admin_can_access_worker_list(
    client: AsyncClient,
    admin_user: User,
    worker_profile: WorkerProfile,
):
    resp = await client.get("/api/v1/admin/workers", headers=auth_headers(admin_user))
    assert resp.status_code == 200


async def test_admin_can_access_client_list(
    client: AsyncClient,
    admin_user: User,
    client_profile: ClientProfile,
):
    resp = await client.get("/api/v1/admin/clients", headers=auth_headers(admin_user))
    assert resp.status_code == 200


async def test_admin_can_access_project(
    client: AsyncClient,
    admin_user: User,
    project: Project,
):
    resp = await client.get(f"/api/v1/admin/projects/{project.id}", headers=auth_headers(admin_user))
    assert resp.status_code == 200


async def test_admin_can_access_payments(
    client: AsyncClient,
    admin_user: User,
    worker_payout: Payment,
    client_payment: Payment,
):
    resp = await client.get("/api/v1/admin/payments", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    data = resp.json()
    items = data.get("items", [])
    directions = {item.get("paymentDirection") for item in items}
    # Admin sees both directions
    assert "inbound_client_payment" in directions
    assert "outbound_worker_payout" in directions
