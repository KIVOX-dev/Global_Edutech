# Global Edutech

Landing page and enquiry system for Global Edutech Academy.

```
frontend/   Next.js 14 site (landing page, courses, gallery, admin dashboard UI)
backend/    Express API (enquiry form, admin login, submissions, Excel export) + MongoDB + email
docs/       Project guides and history
legacy/     Old static site and AI demo server (not used by the app)
```

The frontend proxies `/api/*` to the backend (`BACKEND_URL`), so the browser only talks to one origin and the admin cookie keeps working.

## Run locally

Requires Node 20+.

```bash
# 1. Backend  → http://localhost:4000
cd backend
cp .env.example .env        # fill in values
npm install
npm run dev

# 2. Frontend → http://localhost:3000
cd frontend
cp .env.example .env.local  # JWT_SECRET must equal the backend's
npm install
npm run dev
```

Admin dashboard: http://localhost:3000/admin/login

## Environment variables

| App | Variable | Purpose |
| --- | --- | --- |
| backend | `MONGODB_URI` | MongoDB Atlas connection string |
| backend | `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT` | Enquiry notification emails |
| backend | `CONTACT_RECEIVER_EMAIL` | Who receives the notifications |
| backend | `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login (required in production) |
| backend + frontend | `JWT_SECRET` | Signs/verifies the admin cookie (same value in both; `openssl rand -hex 32`) |
| frontend | `BACKEND_URL` | Deployed backend URL |

Never commit `.env` files; they are git-ignored.

## Deploy (Vercel)

Create **two** Vercel projects from this repo:

| Project | Root Directory | Env vars |
| --- | --- | --- |
| backend | `backend` | all backend vars |
| frontend | `frontend` | `BACKEND_URL` (the backend project's URL), `JWT_SECRET` |

MongoDB Atlas must allow connections from `0.0.0.0/0` (Vercel IPs change).

### CI/CD

[.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) runs on every push/PR to `main`:

1. **backend** – install, syntax check, audit
2. **frontend** – install, type check, build, audit
3. **deploy** – backend then frontend: preview for pull requests, production for pushes to `main`

Add these GitHub repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_BACKEND_PROJECT_ID`, `VERCEL_FRONTEND_PROJECT_ID` (IDs come from `vercel link` → `.vercel/project.json` in each folder). If you prefer Vercel's own Git integration, delete the `deploy` job.

## More docs

See [docs/](docs/) for developer, maintenance and feature guides (some predate the frontend/backend split).
