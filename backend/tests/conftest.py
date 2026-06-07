"""Shared test fixtures for Bridgr backend tests."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Import all models so Base.metadata has every table registered
import app.db.models  # noqa: F401
from app.core.security import hash_password
from app.db.enums import (
    BillingCurrency,
    ChannelType,
    PaymentDirection,
    PaymentMethod,
    PaymentStatus,
    PayeeType,
    PayerType,
    ProjectMemberRole,
    UserRole,
    UserStatus,
    VerificationStatus,
)
from app.db.models.client import ClientProfile
from app.db.models.job import ClientJob, JobListing
from app.db.models.payment import Payment
from app.db.models.project import Project, ProjectChannel, ProjectMember
from app.db.models.user import Base, User
from app.db.models.worker import WorkerProfile
from app.db.session import get_db
from app.main import create_app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    return create_async_engine(TEST_DB_URL, echo=False)


@pytest.fixture
async def db(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest.fixture
def app_instance(db: AsyncSession):
    application = create_app()

    async def _override_db():
        yield db

    application.dependency_overrides[get_db] = _override_db
    return application


@pytest.fixture
async def client(app_instance):
    async with AsyncClient(transport=ASGITransport(app=app_instance), base_url="http://test") as ac:
        yield ac


# ── User fixtures ──────────────────────────────────────────────

@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    user = User(
        email="admin@bridgr.test",
        password_hash=hash_password("Admin@1234"),
        full_name="Admin User",
        role=UserRole.admin,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.fixture
async def worker_user(db: AsyncSession) -> User:
    user = User(
        email="worker@bridgr.test",
        password_hash=hash_password("Worker@1234"),
        full_name="Alice Worker",
        phone="+919876543210",
        role=UserRole.worker,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.fixture
async def worker_profile(db: AsyncSession, worker_user: User) -> WorkerProfile:
    profile = WorkerProfile(
        user_id=worker_user.id,
        bio="Experienced developer",
        city="Mumbai",
        hourly_rate_min_inr=1000,
        hourly_rate_max_inr=2000,
        verification_status=VerificationStatus.approved,
    )
    db.add(profile)
    await db.flush()
    return profile


@pytest.fixture
async def worker2_user(db: AsyncSession) -> User:
    user = User(
        email="worker2@bridgr.test",
        password_hash=hash_password("Worker@1234"),
        full_name="Bob Worker",
        role=UserRole.worker,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.fixture
async def worker2_profile(db: AsyncSession, worker2_user: User) -> WorkerProfile:
    profile = WorkerProfile(
        user_id=worker2_user.id,
        bio="Another developer",
        city="Delhi",
        hourly_rate_min_inr=800,
        hourly_rate_max_inr=1500,
        verification_status=VerificationStatus.approved,
    )
    db.add(profile)
    await db.flush()
    return profile


@pytest.fixture
async def client_user(db: AsyncSession) -> User:
    user = User(
        email="client@acmecorp.test",
        password_hash=hash_password("Client@1234"),
        full_name="Carol Client",
        phone="+12125550199",
        role=UserRole.client,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.fixture
async def client_profile(db: AsyncSession, client_user: User) -> ClientProfile:
    profile = ClientProfile(
        user_id=client_user.id,
        company_name="Acme Corp",
        contact_name="Carol Client",
        contact_email="carol@acmecorp.test",
        contact_phone="+12125550199",
        billing_currency=BillingCurrency.USD,
    )
    db.add(profile)
    await db.flush()
    return profile


@pytest.fixture
async def client2_user(db: AsyncSession) -> User:
    user = User(
        email="client2@othercorp.test",
        password_hash=hash_password("Client@1234"),
        full_name="Dave Client",
        role=UserRole.client,
        status=UserStatus.active,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.fixture
async def client2_profile(db: AsyncSession, client2_user: User) -> ClientProfile:
    profile = ClientProfile(
        user_id=client2_user.id,
        company_name="Other Corp",
        contact_name="Dave Client",
        contact_email="dave@othercorp.test",
        billing_currency=BillingCurrency.USD,
    )
    db.add(profile)
    await db.flush()
    return profile


# ── Project fixtures ───────────────────────────────────────────

@pytest.fixture
async def client_job(db: AsyncSession, client_profile: ClientProfile, admin_user: User) -> ClientJob:
    from app.db.enums import ClientJobStatus, JobCategory
    job = ClientJob(
        client_id=client_profile.id,
        title="Build a website",
        description="We need a full-stack web app",
        category=JobCategory.development,
        client_budget_amount=5000.0,
        client_budget_currency=BillingCurrency.USD,
        status=ClientJobStatus.in_progress,
    )
    db.add(job)
    await db.flush()
    return job


@pytest.fixture
async def project(db: AsyncSession, client_job: ClientJob, admin_user: User) -> Project:
    proj = Project(
        client_job_id=client_job.id,
        title="Website Build Project",
        internal_description="Internal notes about client budget",
        client_visible_summary="Building a website",
        created_by=admin_user.id,
    )
    db.add(proj)
    await db.flush()
    return proj


@pytest.fixture
async def general_channel(db: AsyncSession, project: Project) -> ProjectChannel:
    ch = ProjectChannel(
        project_id=project.id,
        name="general",
        channel_type=ChannelType.general,
    )
    db.add(ch)
    await db.flush()
    return ch


@pytest.fixture
async def admin_private_channel(db: AsyncSession, project: Project) -> ProjectChannel:
    ch = ProjectChannel(
        project_id=project.id,
        name="admin-private",
        channel_type=ChannelType.admin_private,
    )
    db.add(ch)
    await db.flush()
    return ch


@pytest.fixture
async def project_member(
    db: AsyncSession, project: Project, worker_profile: WorkerProfile
) -> ProjectMember:
    member = ProjectMember(
        project_id=project.id,
        worker_id=worker_profile.id,
        role=ProjectMemberRole.worker,
        agreed_amount=2000.0,
        agreed_currency=BillingCurrency.INR,
    )
    db.add(member)
    await db.flush()
    return member


# ── Payment fixtures ───────────────────────────────────────────

@pytest.fixture
async def worker_payout(
    db: AsyncSession, project: Project, worker_profile: WorkerProfile
) -> Payment:
    pmt = Payment(
        project_id=project.id,
        payer_type=PayerType.bridgr,
        payee_type=PayeeType.worker,
        worker_id=worker_profile.id,
        amount=2000.0,
        currency=BillingCurrency.INR,
        payment_direction=PaymentDirection.outbound_worker_payout,
        payment_method=PaymentMethod.bank_transfer,
        status=PaymentStatus.pending,
    )
    db.add(pmt)
    await db.flush()
    return pmt


@pytest.fixture
async def client_payment(
    db: AsyncSession, project: Project, client_profile: ClientProfile
) -> Payment:
    pmt = Payment(
        project_id=project.id,
        payer_type=PayerType.client,
        payee_type=PayeeType.bridgr,
        client_id=client_profile.id,
        amount=5000.0,
        currency=BillingCurrency.USD,
        payment_direction=PaymentDirection.inbound_client_payment,
        payment_method=PaymentMethod.bank_transfer,
        status=PaymentStatus.pending,
    )
    db.add(pmt)
    await db.flush()
    return pmt


@pytest.fixture
async def other_worker_payout(
    db: AsyncSession, project: Project, worker2_profile: WorkerProfile
) -> Payment:
    pmt = Payment(
        project_id=project.id,
        payer_type=PayerType.bridgr,
        payee_type=PayeeType.worker,
        worker_id=worker2_profile.id,
        amount=1500.0,
        currency=BillingCurrency.INR,
        payment_direction=PaymentDirection.outbound_worker_payout,
        payment_method=PaymentMethod.upi,
        status=PaymentStatus.pending,
    )
    db.add(pmt)
    await db.flush()
    return pmt


# ── Job listing fixture ────────────────────────────────────────

@pytest.fixture
async def job_listing(db: AsyncSession, client_job: ClientJob, admin_user: User) -> JobListing:
    from app.db.enums import JobCategory, JobListingStatus, JobListingType, JobListingVisibility
    listing = JobListing(
        client_job_id=client_job.id,
        title="Full-Stack Developer Needed",
        public_description="We need a web developer. Budget details not disclosed.",
        category=JobCategory.development,
        worker_budget_amount=100000.0,
        worker_budget_currency=BillingCurrency.INR,
        listing_type=JobListingType.open_application,
        status=JobListingStatus.published,
        visibility=JobListingVisibility.all_verified,
        created_by=admin_user.id,
    )
    db.add(listing)
    await db.flush()
    return listing
