# Bridgr: Local Docker Setup, Testing, and Deployment

## 1. What this project contains

- Frontend: Vite + React, runs on `http://localhost:5173`
- Backend: FastAPI, runs on `http://localhost:8000`
- Database: PostgreSQL, runs on `localhost:5432`
- Database schema: Alembic migrations inside `backend/alembic/versions`
- pgAdmin: optional database viewer, runs on `http://localhost:5050`

You do not need to manually create all tables in pgAdmin. Alembic creates the tables from your code.

---

## 2. Install required software

Install these on Windows:

1. Docker Desktop
2. Git
3. Node.js LTS, useful outside Docker
4. Python 3.12, useful outside Docker
5. Postman

After installing Docker Desktop, open a terminal and check:

```bash
docker --version
docker compose version
```

---

## 3. Run everything locally with Docker

From the project root where `docker-compose.yml` exists:

```bash
docker compose up --build
```

This starts:

- PostgreSQL database
- pgAdmin
- Backend API
- Frontend app

Open:

```txt
Frontend: http://localhost:5173
Backend health: http://localhost:8000/health
Backend docs: http://localhost:8000/docs
pgAdmin: http://localhost:5050
```

pgAdmin login:

```txt
Email: admin@bridgr.local
Password: admin12345
```

Admin app login seeded by backend:

```txt
Email: admin@bridgr.local
Password: ChangeMe123!
```

---

## 4. Connect pgAdmin to Docker PostgreSQL

Inside pgAdmin, create a new server:

General tab:

```txt
Name: Bridgr Local Docker
```

Connection tab:

```txt
Host name/address: db
Port: 5432
Maintenance database: bridgr
Username: bridgr
Password: bridgr_password
```

Important: inside Docker, pgAdmin connects to Postgres using host `db`, not `localhost`.

---

## 5. Database migration commands

When containers are running, run this from another terminal:

```bash
docker compose exec backend alembic current
```

Apply migrations manually:

```bash
docker compose exec backend alembic upgrade head
```

Seed admin and skills:

```bash
docker compose exec backend python -m app.scripts.seed
```

Reset database fully:

```bash
docker compose down -v
docker compose up --build
```

`down -v` deletes the Docker database volume, so use it only when you want a fresh database.

---

## 6. Test APIs

Health check:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/health
```

Open Swagger docs:

```txt
http://localhost:8000/docs
```

Use Postman with base URL:

```txt
http://localhost:8000/api/v1
```

Recommended Postman folders:

- Health
- Auth
- Admin
- Worker
- Client
- Projects
- Payments
- Uploads

---

## 7. Run without Docker, optional

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## 8. Deployment plan

Recommended stack:

- Frontend: Vercel
- Backend: Railway
- Database: Neon PostgreSQL
- File storage later: Cloudflare R2
- Email later: Resend
- Payments later: Razorpay

### Step A: Push code to GitHub

```bash
git init
git add .
git commit -m "prepare Bridgr for deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step B: Create Neon database

1. Create Neon account
2. Create project `bridgr`
3. Create database `bridgr`
4. Copy connection string
5. For this backend, use async SQLAlchemy format:

```txt
postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
```

If Neon gives:

```txt
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

Change it to:

```txt
postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
```

### Step C: Deploy backend on Railway

1. Create Railway project
2. Connect GitHub repo
3. Set service root directory to `backend`
4. Add environment variables:

```txt
ENVIRONMENT=production
APP_NAME=Bridgr API
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
FRONTEND_URL=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app
VERCEL_FRONTEND_URL=https://your-vercel-domain.vercel.app
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong temporary password>
ADMIN_NAME=Admin User
```

5. Deploy backend
6. Check:

```txt
https://your-railway-api-url/health
```

7. Run migrations on Railway:

```bash
railway run alembic upgrade head
railway run python -m app.scripts.seed
```

### Step D: Deploy frontend on Vercel

1. Import GitHub repo in Vercel
2. Set root directory to `frontend`
3. Build command:

```bash
npm run build
```

4. Output directory:

```txt
dist
```

5. Add environment variables:

```txt
VITE_API_BASE_URL=https://your-railway-api-url/api/v1
VITE_API_URL=https://your-railway-api-url/api/v1
VITE_WS_URL=wss://your-railway-api-url
VITE_APP_NAME=Bridgr
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_ENABLE_DEMO_AUTH=false
VITE_ENABLE_API_MOCKS=false
```

6. Deploy frontend

### Step E: Update Railway CORS after Vercel deploy

After Vercel gives your real URL, update Railway variables:

```txt
FRONTEND_URL=https://your-real-vercel-url.vercel.app
CORS_ORIGINS=https://your-real-vercel-url.vercel.app
VERCEL_FRONTEND_URL=https://your-real-vercel-url.vercel.app
```

Redeploy backend.

---

## 9. Known fixes applied in this package

1. Added Docker setup for database, pgAdmin, backend, and frontend.
2. Removed deprecated TypeScript path options from `frontend/tsconfig.app.json`.
3. Fixed one TypeScript narrowing issue in `WorkerOnboardingPage.tsx`.

Frontend build still needs a clean dependency install because the uploaded `node_modules` is missing a platform-specific Vite/Rolldown optional package. Run:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

On Windows PowerShell:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run build
```

---

## 10. Production readiness checklist

Before taking payments or real users:

- Build frontend successfully
- Backend health endpoint works
- Alembic migrations run successfully on Neon
- Admin user seeded
- Auth tested in Postman
- Worker onboarding tested
- Client onboarding tested
- Admin dashboard tested
- CORS verified from Vercel to Railway
- Strong JWT secrets configured
- Demo/mock flags disabled
- Error tracking added through Sentry
- Email verification through Resend added
- File upload through Cloudflare R2 added
- Payment flow through Razorpay added and tested in test mode
