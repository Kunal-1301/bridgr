# Bridgr Frontend

React + TypeScript + Vite frontend for Bridgr.

## Local Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Default local env:

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=Bridgr
VITE_APP_ENV=development
VITE_USE_MOCKS=false
```

## Build

```bash
npm run build
```

The production build outputs to `dist/`. Source maps are disabled by default and are only generated when `VITE_ENABLE_SOURCEMAPS=true` is set.

## Vercel Deployment

1. Create a new Vercel project and connect this repository.
2. Use these project settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add production environment variables:

```bash
VITE_API_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN/api/v1
VITE_WS_URL=wss://YOUR-RAILWAY-BACKEND-DOMAIN
VITE_APP_NAME=Bridgr
VITE_APP_ENV=production
VITE_USE_MOCKS=false
```

4. Deploy the project.

`vercel.json` includes an SPA rewrite so direct refreshes work for client-side routes such as:

- `/login`
- `/register`
- `/admin/login`
- `/w/dashboard`
- `/c/dashboard`
- `/admin/dashboard`

After deployment, add the Vercel frontend URL to the Railway backend env vars:

```bash
FRONTEND_URL=https://YOUR-VERCEL-DOMAIN
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN
VERCEL_FRONTEND_URL=https://YOUR-VERCEL-DOMAIN
ENVIRONMENT=production
```
