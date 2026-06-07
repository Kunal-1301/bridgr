import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import engine
from app.main import app


@pytest.fixture(autouse=True)
async def close_db_engine():
    yield
    await engine.dispose()


@pytest.mark.asyncio
async def test_root_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_api_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
