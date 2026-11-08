# Global Edutech

Landing page **and** institute management system (Admin, Staff, Attendance, Fees, automatic fee reminders).

```
frontend/   Next.js 14 (App Router, Tailwind): landing page, enquiry admin, and the new /login, /admin/*, /staff/* screens
backend/    Express API: legacy enquiry endpoints + the management API (Mongoose, B2, Brevo/Gmail, cron)
scripts/    copy-static.mjs, bundle-appsail.mjs (build helpers for AppSail)
app-config.json   Zoho Catalyst AppSail configuration
docs/       Older guides (landing page era)
```

> The folders are still called `frontend/` and `backend/` (not `client/` / `server/`) so the existing Vercel deployment and CI keep working. They play the same roles.

## How it fits together

- **Landing page + enquiry admin (unchanged):** `/`, `/courses`, `/gallery`, `/admin/login`, `/admin/dashboard`. Still deployable to Vercel exactly as before.
- **Management system (new):** one login at `/login`. Admins land on `/admin`, staff on `/staff`. The old enquiry dashboard is linked from the admin sidebar as "Website Enquiries".
- **Production target:** one Zoho Catalyst **AppSail** service. Express serves `/api/*` and the statically exported frontend (`next build` with `output: 'export'`, copied to `backend/public`). Same origin, so cookies just work.
- **Data:** MongoDB Atlas (Mongoose). **Files:** private Backblaze B2 bucket, presigned URLs only. **Email:** Brevo API first, Gmail SMTP fallback. **Timezone:** Asia/Kolkata everywhere; attendance and fee dates are stored as `"YYYY-MM-DD"` strings.

## Quick start (local)

Requires Node 20+.

```bash
# 1. Backend (http://localhost:9000)
cd backend
cp .env.example .env     # replace the your_ / changeme values (see below)
npm install
npm run seed             # sample data (needs a real MONGODB_URI)
npm run dev

# 2. Frontend (http://localhost:5173)
cd frontend
echo BACKEND_URL=http://localhost:9000 > .env.local   # add JWT_SECRET=<legacy backend JWT_SECRET> for the old enquiry admin
npm install
npm run dev
```

Open http://localhost:5173/login.

**Placeholder mode:** if a variable still contains `your_` or `changeme`, that service is skipped with a clear warning in the log (no B2 calls, no emails, no cron sends, DB routes answer `503 SERVICE_NOT_CONFIGURED`) and the rest of the app keeps running. In `NODE_ENV=production` the server refuses to start without a real `MONGODB_URI`, strong JWT secrets and an https `APP_URL`. Admins can see which integrations are configured at `GET /api/admin/system/status` (and on the Settings page); no values are ever shown.

### Default logins (after `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `ADMIN_SEED_EMAIL` (default `admin@example.com`) | `ADMIN_SEED_PASSWORD` (default `changeme_strong_password`) |
| Staff | `priya.staff@example.com` (also `rahul.staff@…`, `anita.staff@…`) | `Staff@12345` |

Change the admin password immediately in any real environment. Staff created from the admin panel get a one-time temporary password and must change it at first login.

### Tests

```bash
cd backend && npm test      # vitest + supertest + mongodb-memory-server (downloads a MongoDB binary on first run)
```

Covers: role protection, refresh-token rotation and reuse detection, account lockout, duplicate-attendance prevention (including concurrent submits), percentage with holidays excluded, staff edit window, partial payments and overpayment races, reminder rule matching, no duplicate reminders (sequential and concurrent runs), Brevo failure falling back to Gmail, and a walk through most admin and staff endpoints.

## Environment variables (backend)

| Variable | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT` | Mode and port. Server listens on `X_ZOHO_CATALYST_LISTEN_PORT`, else `PORT`, else `9000`, on `0.0.0.0` |
| `APP_URL` | Public URL of the app. The only CORS origin; used in email links |
| `APP_TIMEZONE`, `INSTITUTE_NAME` | `Asia/Kolkata`, shown in emails and receipts |
| `MONGODB_URI` | Atlas connection string (include the database name) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Two different random strings, 32+ chars (`openssl rand -hex 32`) |
| `COOKIE_DOMAIN` | Leave `localhost`/blank locally; your domain in production if needed |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | First admin created by `npm run seed` |
| `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_REGION`, `B2_ENDPOINT` | Backblaze B2 (S3 compatible) |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Primary email provider |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Fallback email provider |
| `REMINDER_CRON_TIME` | Default daily reminder time `HH:mm` (IST); editable later in Admin → Reminders |
| `PAYMENT_INSTRUCTIONS` (optional) | Text for the `{payment_instructions}` placeholder |

The legacy enquiry admin still uses `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CONTACT_RECEIVER_EMAIL`, `SMTP_*` (see `backend/.env.example`). Frontend: `BACKEND_URL` (dev proxy) and `JWT_SECRET` (legacy admin middleware). Never commit `.env` files.

## Service setup

### MongoDB Atlas
1. Create a free **M0** cluster at cloud.mongodb.com.
2. Database Access → add a **dedicated user** with role `readWrite` on the `global_edutech` database only.
3. Network Access → add AppSail's outbound IPs, or `0.0.0.0/0` with a strong password (AppSail IPs are not fixed).
4. Connect → Drivers → copy the string into `MONGODB_URI`, adding the database name: `mongodb+srv://user:pass@cluster.mongodb.net/global_edutech?retryWrites=true&w=majority`.

### Backblaze B2 (private bucket + application key)
1. Create a bucket, **Files in Bucket are: Private**.
2. App Keys → Add a New Application Key, restricted to that bucket, read + write. Copy `keyID` → `B2_KEY_ID` and `applicationKey` → `B2_APPLICATION_KEY` (shown once).
3. Bucket details show the endpoint, e.g. `s3.us-west-004.backblazeb2.com`: set `B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com` and `B2_REGION=us-west-004`.
4. **CORS rule** (required for browser uploads). Use the B2 CLI (`b2 bucket update --cors-rules ... <bucket> allPrivate`) or the B2 web console's custom CORS editor with:

```json
[
  {
    "corsRuleName": "app-uploads",
    "allowedOrigins": ["https://YOUR-APP-URL"],
    "allowedOperations": ["s3_put", "s3_get", "s3_head"],
    "allowedHeaders": ["*"],
    "exposeHeaders": ["ETag"],
    "maxAgeSeconds": 3600
  }
]
```
Use your real `APP_URL` as the origin (add `http://localhost:5173` while developing). Uploads: the server validates type (JPG/PNG/PDF) and size (5 MB) before issuing a 5-minute presigned PUT, then `POST /api/files/confirm` re-checks the real object (size and type) and deletes it if it violates the rules. Downloads are 5-minute presigned GET links, authorised per owner.

### Brevo (primary email)
1. Create an account at brevo.com → SMTP & API → **API Keys** → generate a v3 key → `BREVO_API_KEY`.
2. Senders & IP → add and **verify** the sender address → `BREVO_SENDER_EMAIL` (unverified senders are rejected). Free plan is about 300 emails/day; the app caps itself at 280.

### Gmail (fallback)
Turn on 2-step verification, then Google Account → Security → App passwords → create one → 16 characters into `GMAIL_APP_PASSWORD`, with `GMAIL_USER` your address. Never the normal password. Capped at 450/day.

Delivery order: Brevo, one retry, then Gmail. Sends are queued with a delay between messages.

## Deploy to Zoho Catalyst AppSail

AppSail storage is **ephemeral**: nothing is ever written to disk, all files go to B2.

```bash
npm install -g zcatalyst-cli
catalyst login
catalyst init            # in the repo root: pick your project, choose AppSail (Node.js) when asked
npm run deploy:build     # builds the static frontend into backend/public, then creates ./appsail-build (with production node_modules)
catalyst deploy appsail --name global-edutech --build-path "$(pwd)/appsail-build" --stack node22 --command "node src/index.js" -ni
```
Notes:
- `--build-path` must be an absolute path. `app-config.json` documents the same settings (`build_path: ./appsail-build`, `stack: node22`, start command `node src/index.js`) for linked deploys, where `predeploy` runs the build for you.
- **Environment variables:** set them in the AppSail **console** (Service → Configuration → Environment Variables) with the standalone deploy above. If you instead link the service (`catalyst appsail:add`) and deploy with `app-config.json`, the file's `env_variables` replace console values on every deploy, so do not mix the two. Set `NODE_ENV=production`, `APP_URL` (the AppSail URL or your custom domain), all secrets, and `COOKIE_DOMAIN` only if you use a custom domain.
- Logs: Catalyst console → AppSail → your service → **Logs**, or `catalyst logs`.
- The app must listen within 10 seconds; it binds `0.0.0.0` on `X_ZOHO_CATALYST_LISTEN_PORT`.
- Reminders use an in-process cron guarded by a MongoDB lock (`JobLock`) plus a unique index on `ReminderLog`, so several AppSail instances never send duplicates.

### Post-deploy checklist
1. `GET /api/health` returns `ok` with `"db": true`.
2. Seed the admin: run `npm run seed` once from a machine with the production `MONGODB_URI` and `ADMIN_SEED_*` (creates sample data too; for a clean production start, create the admin and delete the `SEED…` students, or ask me for an admin-only seed flag).
3. Log in at `/login` and open Settings → System status: everything green.
4. Create a course (with instalments), a batch, a student; assign staff to the batch.
5. Log in as staff (change the temporary password), mark attendance.
6. Admin → Fees → Generate fees, record a payment, download the receipt PDF (verifies B2).
7. Admin → Reminders → **Run daily job now**; check the log table.
8. Confirm the email in the Brevo dashboard (Transactional → Logs).
9. Upload a student photo and a document (verifies the B2 CORS rule).

## API list

All responses: `{ success, data, meta? }` or `{ success:false, code, message, details }`. Auth is via httpOnly cookies. `/api` is rate limited; login, forgot-password and reminder triggers are stricter.

**Auth** `POST /api/auth/login | refresh | logout | change-password | forgot-password | reset-password`, `GET /api/auth/me`

**Files** `POST /api/files/upload-url`, `POST /api/files/confirm`, `GET /api/files/download-url?key=`, `DELETE /api/files`

**Admin** (ADMIN only)
- `GET /api/admin/dashboard`, `GET /api/admin/system/status`
- Staff: `GET|POST /staff`, `GET|PATCH|DELETE /staff/:id`, `PATCH /staff/:id/status`, `POST /staff/:id/reset-password`
- Students: `GET|POST /students`, `GET|PATCH|DELETE /students/:id`, `POST /students/import`
- Courses/batches: `GET|POST /courses`, `PATCH|DELETE /courses/:id`, `GET|POST /batches`, `PATCH|DELETE /batches/:id`, `POST /batches/:id/assign-staff`, `POST /batches/:id/assign-students`
- `GET|POST|DELETE /holidays`, `GET|PATCH /settings`, `GET /audit-logs`
- Attendance oversight: `GET /attendance/staff`, `PATCH /attendance/staff/:id`, `GET /leaves`, `PATCH /leaves/:id`
- Reports: `GET /reports/attendance?type=student|batch|staff&from&to&format=json|csv`, `GET /reports/low-attendance`
- Fees: `GET|POST /fee-structures`, `POST /fees/generate`, `GET /fees`, `GET /fees/dashboard`, `GET /fees/:id`, `POST /fees/:id/payments`, `GET /payments`, `GET /payments/:id/receipt`
- Reminders: `GET|PATCH /reminders/settings`, `POST /reminders/send/:studentFeeId`, `POST /reminders/send-overdue`, `POST /reminders/run`, `GET /reminders/logs`

**Staff** (STAFF only, own data) `GET /api/staff/dashboard | batches | batches/:id/students | profile | attendance/me?month= | leaves | fees` (fees only if enabled in Settings), `PATCH /profile`, `POST /attendance/check-in | check-out`, `POST /leaves`

**Attendance** (ADMIN + STAFF, staff scoped to assigned batches) `GET|POST /api/attendance/batch/:batchId`, `PATCH /api/attendance/:id`, `GET /api/attendance/student/:studentId?from=&to=`

**Legacy** `POST /api/submit-form`, `/api/admin/login|logout|submissions|export` (enquiry admin, unchanged)

## Assumptions and decisions

- Kept Next.js (not Vite) and the `frontend/`/`backend/` names; production uses a static export so one service can serve everything. Page routing for the portal uses client-side guards; the API enforces every permission on the server.
- `bcryptjs` (pure JS, same algorithm, cost 12) instead of native `bcrypt`, so AppSail needs no native build. `mongodb-memory-server` runs standalone, so payments use an atomic guarded update instead of a multi-document transaction; this is safe against concurrent overpayment (tested).
- Staff identifiers in the API are **user ids** (`/admin/staff/:id`, `staff/{userId}/docs/…`).
- Deleting students, staff, courses and batches that have history returns `409`; deactivate or mark inactive instead.
- Attendance %: (Present + Late) / (Present + Late + Absent); Excused, holidays and non-working days are excluded. Working days default to Mon–Sat (Settings).
- Reminder rules: D-7/D-3/D-1 (configurable), D0, then the first overdue email immediately and one every N days up to the max. Failed sends are logged and can be re-sent manually.
- Daily email caps and the send queue are per process (in memory).
- Admin routes must run through `requireDb`: `/api/admin/system/status` needs a database and an admin login, so it cannot report on a completely database-less install (the log shows the same warnings at startup).

## What to build next

Parent portal and attendance notifications (SMS/WhatsApp channel plugs into `services/reminders/channels.js`), online payments (Razorpay) with auto receipts, timetable and exam/marks module, bulk CSV export for fees, admin-only production seed flag, 2-factor sign-in for admins, E2E tests (Playwright) for the portal screens.
