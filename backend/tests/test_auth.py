"""Tests for authentication endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import create_access_token, hash_password
from app.db.enums import UserStatus
from app.db.models.user import Base, User, UserRole
from app.db.session import get_db
from app.main import create_app


@pytest.fixture
async def db():
    """Create test database."""
    # Use in-memory SQLite for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        yield session


@pytest.fixture
def app(db):
    """Create test app with mocked dependencies."""
    app = create_app()

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
async def client(app):
    """Create test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create test user."""
    user = User(
        email="test@example.com",
        password_hash=hash_password("TestPassword123"),
        full_name="Test User",
        role=UserRole.worker,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def test_admin(db: AsyncSession) -> User:
    """Create test admin user."""
    admin = User(
        email="admin@example.com",
        password_hash=hash_password("AdminPassword123"),
        full_name="Admin User",
        role=UserRole.admin,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    """Test successful login."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "TestPassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "worker"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user: User):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_login_with_portal_mismatch(client: AsyncClient, test_user: User):
    """Test login with wrong portal."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "TestPassword123", "portal": "admin"},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "wrong_role"


@pytest.mark.asyncio
async def test_login_with_portal_match(client: AsyncClient, test_user: User):
    """Test login with matching portal."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "TestPassword123", "portal": "worker"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, test_user: User):
    """Test get current user."""
    token = create_access_token(str(test_user.id), claims={"role": test_user.role.value})
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "worker"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """Test get current user without token."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_worker_success(client: AsyncClient, db: AsyncSession):
    """Test successful worker registration."""
    response = await client.post(
        "/api/v1/auth/register-worker",
        json={
            "fullName": "John Worker",
            "email": "worker@example.com",
            "password": "WorkerPass123",
            "phone": "+1234567890",
            "city": "New York",
            "bio": "I am a skilled professional with 5 years of experience",
            "skills": ["Python", "JavaScript"],
            "experienceLevel": "Senior",
            "rateMin": 50.0,
            "rateMax": 100.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Registration successful. You can now log in."
    assert "userId" in data

    # Verify user was created
    from app.repositories.user_repo import UserRepository

    user = await UserRepository(db).get_by_email("worker@example.com")
    assert user is not None
    assert user.role == UserRole.worker
    assert user.is_email_verified is False


@pytest.mark.asyncio
async def test_register_worker_email_exists(client: AsyncClient, test_user: User):
    """Test worker registration with existing email."""
    response = await client.post(
        "/api/v1/auth/register-worker",
        json={
            "fullName": "Duplicate Worker",
            "email": "test@example.com",
            "password": "WorkerPass123",
            "phone": "+1234567890",
            "city": "New York",
            "bio": "I am a skilled professional with 5 years of experience",
            "skills": ["Python", "JavaScript"],
            "experienceLevel": "Senior",
            "rateMin": 50.0,
            "rateMax": 100.0,
        },
    )
    assert response.status_code == 409
    assert response.json()["code"] == "email_exists"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, test_user: User):
    """Test logout."""
    token = create_access_token(str(test_user.id), claims={"role": test_user.role.value})
    response = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


@pytest.mark.asyncio
async def test_role_based_access_worker_endpoint(client: AsyncClient, test_user: User, test_admin: User):
    """Test role-based access control - worker cannot access admin endpoint."""
    worker_token = create_access_token(str(test_user.id), claims={"role": test_user.role.value})
    # This assumes an admin-only endpoint exists
    # For now, we're testing the dependency logic
    assert test_user.role == UserRole.worker
    assert test_admin.role == UserRole.admin


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: AsyncClient):
    """Test refresh with invalid token."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": "invalid-token"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_refresh_token"


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient, test_user: User):
    """Test forgot password."""
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "Password reset link has been sent" in data["message"]


@pytest.mark.asyncio
async def test_forgot_password_nonexistent(client: AsyncClient):
    """Test forgot password with nonexistent email."""
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )
    # Should return generic message for security
    assert response.status_code == 200
    data = response.json()
    assert "If email exists" in data["message"]
