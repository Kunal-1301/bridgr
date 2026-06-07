# Bridgr Production Deployment

This repo is deployable as a low-cost MVP with:

- Frontend: Vercel
- Backend: Railway or Render
- Database: Railway PostgreSQL, Supabase PostgreSQL, or Neon PostgreSQL
- Storage: Cloudflare R2 or Supabase Storage
- Email: Resend
- Payments: Razorpay first; Stripe later for international clients
- Monitoring: Sentry
- Analytics: PostHog or Plausible

## Frontend

Deploy the repository root to Vercel.

Build settings:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

Required Vercel env vars:

- `VITE_API_BASE_URL=https://your-api.example.com/api/v1`
- `VITE_APP_ENV=production`
- `VITE_USE_MOCKS=false`
- `VITE_ENABLE_API_MOCKS=false`
- `VITE_ENABLE_DEMO_AUTH=false`

Optional:

- `VITE_SENTRY_DSN`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST=https://app.posthog.com`
- `VITE_PLAUSIBLE_DOMAIN`
- `VITE_ENABLE_SOURCEMAPS=true`

SPA routing is handled by `vercel.json`.

Bundle analysis:

```bash
npm run analyze
```

This emits `bundle-report.html`, which is gitignored.

## Backend

Deploy `backend/` to Railway or Render.

Production command:

```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers ${WEB_CONCURRENCY:-2} --timeout 120
```

Migration command:

```bash
alembic upgrade head
```

Admin-only seed command:

```bash
python -m app.scripts.create_admin
```

Do not run broad demo seeders in production. Do not create fake workers or clients unless a future explicit demo flag is added and enabled.

Required backend env vars:

- `ENVIRONMENT=production`
- `DATABASE_URL=postgresql+asyncpg://...`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `CORS_ORIGINS=https://your-frontend.vercel.app`
- `REFRESH_COOKIE_DOMAIN=.yourdomain.com` when frontend/backend share a parent domain
- `SECURE_COOKIE_SECURE=true`
- `SECURE_COOKIE_SAME_SITE=lax`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Optional production env vars:

- `VERCEL_FRONTEND_URL=your-frontend.vercel.app`
- `CORS_ORIGIN_REGEX=https://.*\.vercel\.app`
- `WEB_CONCURRENCY=2`
- `MAX_REQUEST_BODY_BYTES=10485760`
- `AUTH_RATE_LIMIT_REQUESTS=20`
- `AUTH_RATE_LIMIT_WINDOW_SECONDS=60`
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`

Docs and Redoc are disabled automatically when `ENVIRONMENT=production`.

## Database

Provision PostgreSQL 15+ on Railway, Supabase, or Neon.

Then run:

```bash
cd backend
alembic upgrade head
python -m app.scripts.create_admin
```

The production database should contain the admin user and reference schema only. Keep demo data out of production.

## Storage

Use private buckets by default:

- `worker-resumes`
- `worker-id-proofs`
- `portfolio-files`
- `project-files`
- `invoices`

Cloudflare R2 env vars:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME=bridgr`
- `R2_WORKER_RESUMES_BUCKET=worker-resumes`
- `R2_WORKER_ID_PROOFS_BUCKET=worker-id-proofs`
- `R2_PORTFOLIO_FILES_BUCKET=portfolio-files`
- `R2_PROJECT_FILES_BUCKET=project-files`
- `R2_INVOICES_BUCKET=invoices`

All uploads and downloads should use presigned URLs. Do not expose public ID proof URLs.

Presign endpoint:

```http
GET /api/v1/uploads/presign?filename=resume.pdf&contentType=application/pdf&category=worker-resumes&size=123456
```

## Email

Configure a verified Resend domain and set:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Bridgr <noreply@yourdomain.com>`

Required templates:

- Verify email
- Worker approved
- Worker rejected
- Reset password
- Client invite
- Payment reminder

## Payments

Use Razorpay first for India payment flows and payout/payment records:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Stripe can be enabled later for international clients. Avoid exposing worker payout amounts or internal margin in client-facing responses.

## Smoke Tests

After deploy:

- `GET /health`
- Worker registration
- Worker login
- Admin login
- Client invite/login
- Admin creates worker-facing listing
- Worker sees listing without client name, company, contact, original budget, or margin
- Client sees project without worker identity, payout, or margin
- File upload presign works
- Payment page loads

Deployment is acceptable only when privacy smoke tests pass.
