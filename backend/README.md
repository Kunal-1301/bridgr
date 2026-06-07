# Bridgr Backend

FastAPI backend skeleton for the Bridgr B2B2C freelance arbitrage platform.

## Stack

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2.0 async + asyncpg
- Alembic
- Pydantic v2 + pydantic-settings
- python-jose JWT
- passlib/bcrypt
- pytest + ruff

## Local Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Health checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/health
```

## Database Setup

### Prerequisites

- PostgreSQL 14+ running locally or on Railway
- `DATABASE_URL` set in `.env` (see `.env.example`)

### 1. Run migrations

From the `backend/` directory:

```bash
alembic upgrade head
```

This creates all 19 tables, 33 PostgreSQL enum types, and all named indexes in one migration (`0001_initial_schema`).

To roll back everything:

```bash
alembic downgrade base
```

### 2. Seed initial data

```bash
python -m app.scripts.seed
```

Requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. Seeds:

- One admin user (idempotent — skips if email already exists)
- 12 reference skills: Python, React, FastAPI, PostgreSQL, UI Design, Graphic Design, Video Editing, Content Writing, SEO, Virtual Assistant, Data Entry, WordPress

### 3. Admin-only shortcut

```bash
python -m app.scripts.create_admin
```

Creates only the admin user (no skills).

### Alembic reference

```bash
# Check current migration state
alembic current

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe the change"

# Apply pending migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

The Alembic environment reads SQLAlchemy metadata from `app.db.base`.

## Railway Deployment

The backend is Railway-ready with `Procfile` and `railway.json`. Railway injects `PORT`, and the start command reads it automatically:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check:

```bash
GET /health
```

### 1. Create the Railway project

Create a new Railway project and connect this repository. Set the backend service root to `backend/` if Railway does not detect it automatically.

### 2. Add PostgreSQL

Add the Railway PostgreSQL plugin. Copy its connection string into the backend service as:

```bash
DATABASE_URL=postgresql+asyncpg://...
```

If Railway provides a `postgresql://` URL, keep the same credentials/host/database and change the scheme to `postgresql+asyncpg://`.

### 3. Add environment variables

Set these in the Railway backend service:

```bash
ENVIRONMENT=production
APP_NAME=Bridgr API
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET=<strong random secret>
JWT_REFRESH_SECRET=<different strong random secret>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
FRONTEND_URL=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app
VERCEL_FRONTEND_URL=https://your-vercel-domain.vercel.app
ADMIN_EMAIL=admin@bridgr.local
ADMIN_PASSWORD=<strong temporary password>
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT_URL=
RESEND_API_KEY=
```

In production, refresh cookies default to `Secure=True` and `SameSite=None`, which supports the Vercel frontend calling the Railway API cross-site. The CORS config also supports Vercel domains through `FRONTEND_URL`, `CORS_ORIGINS`, `VERCEL_FRONTEND_URL`, and the production `*.vercel.app` regex fallback.

### 4. Run migrations

From your local terminal with Railway CLI authenticated, run:

```bash
railway run alembic upgrade head
```

### 5. Seed initial data

Seed the admin user and reference skills:

```bash
railway run python -m app.scripts.seed
```

The seed script is idempotent for the admin user and skills.

## Privacy Rules

- Client-facing endpoints must never return worker identity, worker contact details, worker rates, worker IDs, or payout values.
- Worker-facing endpoints must never return client identity, client company, client email, client phone, original client budget, or raw client documents.
- Admin endpoints can return full margin, client, worker, payment, and audit data.

These boundaries should be preserved in schemas and service methods as implementation moves beyond placeholders.
