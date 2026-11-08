# Global Edutech

The Global Edutech website and institute management system in one project:

- **Public website:** home page, courses, gallery, an Enquire Now page, Privacy Policy and Terms of Service.
- **Admin panel (`/admin`):** enquiries, students, staff, courses and batches, attendance, leaves, fees, payments, reminders, reports, holidays, settings and an audit log.
- **Staff portal (`/staff`):** dashboard, batches, mark attendance, own attendance (check-in/out), leaves and profile.
- **Automatic fee reminders:** a daily job emails students and parents before and after due dates.

Built mobile-first: the admin and staff screens turn tables into cards, use a bottom tab bar on phones and have large tap targets.

---

## 1. How it is built

```
global-edutech/
├── frontend/                Next.js 14 (App Router, TypeScript, Tailwind)
│   ├── app/
│   │   ├── (site)/          public website: home, courses, gallery, enquiry, privacy-policy, terms-of-service
│   │   ├── (auth)/          login, forgot-password, reset-password, change-password
│   │   ├── admin/(portal)/  admin panel screens
│   │   └── staff/           staff portal screens
│   ├── components/
│   │   ├── layout/          Header, Footer
│   │   ├── home/            home page sections, hero carousel, testimonials, contact
│   │   ├── courses/         course cards
│   │   ├── gallery/         gallery grid, preview, lightbox
│   │   ├── forms/           enquiry form, custom dropdown
│   │   ├── shared/          legal page layout, running-logos marquee
│   │   ├── portal/          admin/staff shell, tables, modals, charts, attendance sheet
│   │   ├── icons/           duotone SVG icons
│   │   ├── theme/           theme provider and toggle
│   │   └── ui/              base UI components (buttons, inputs, toasts…)
│   ├── data/                courses.ts, gallery.ts (site content)
│   ├── lib/                 helpers (portal/ holds the API client, auth context, hooks)
│   └── public/images/       logos and photos
├── backend/                 Express API (Node 22+, ES modules)
│   ├── src/
│   │   ├── config/          env loader, logger, database
│   │   ├── models/          Mongoose models
│   │   ├── routes/          route definitions
│   │   ├── controllers/     request handlers
│   │   ├── services/        business logic (attendance, fees, reminders, email, storage…)
│   │   ├── middleware/      auth, validation, rate limits, errors
│   │   ├── validators/      zod helpers
│   │   ├── jobs/            reminder scheduler
│   │   └── utils/           dates, csv, http helpers
│   ├── scripts/             seed.js, dev-memory.js
│   └── tests/               vitest + supertest
├── deploy/
│   ├── docker/              Dockerfile (single image), Dockerfile.dockerignore, docker-compose.yml
│   └── appsail/             build, bundle and deploy scripts for Zoho Catalyst AppSail
├── archive/                 old landing-page era docs and the original static site (not used)
├── app-config.json          AppSail configuration (kept at the root where the Catalyst CLI looks for it)
└── package.json             root scripts: build, bundle, deploy, docker, test
```

| Concern | Choice |
| --- | --- |
| Database | MongoDB Atlas via Mongoose |
| File storage | Backblaze B2 (S3-compatible, **private** bucket, short-lived presigned URLs only) |
| Hosting | One Zoho Catalyst AppSail service: Express serves `/api/*` and the built frontend |
| Auth | JWT in httpOnly cookies (15 min access, 7 day refresh with rotation), bcrypt (cost 12) |
| Email | Brevo transactional API only |
| Timezone | Asia/Kolkata everywhere. Attendance and fee dates are stored as `"YYYY-MM-DD"` strings so there is no timezone drift |
| Logging | pino, with tokens, cookies and passwords redacted |

In production the frontend is exported to static files (`next build` with `output: 'export'`, switched on by `NEXT_OUTPUT=export`) and copied to `backend/public`. Express serves them, so the browser talks to one origin and cookies just work. In development Next proxies `/api/*` to the backend.

## 2. Run it locally

Requires **Node 22+** (tested on 24).

### Option A: try it with throwaway data (no database needed)

```bash
npm --prefix backend install
npm --prefix frontend install

cd backend && npm run dev:memory      # API on http://localhost:9000 with an in-memory MongoDB, seeded
cd frontend && npm run dev            # site on http://localhost:5173
```

`dev:memory` starts a temporary MongoDB, seeds sample data and runs the API. Everything is lost when you stop it, and your real `MONGODB_URI` is never used.

### Option B: use your own MongoDB Atlas

```bash
cd backend
cp .env.example .env          # then replace every your_ / changeme value (section 4)
npm install
npm run seed                  # optional: sample data (writes to the database in MONGODB_URI)
npm run dev                   # API on http://localhost:9000

cd ../frontend
echo BACKEND_URL=http://localhost:9000 > .env.local
npm install
npm run dev                   # http://localhost:5173
```

### Open it

| Page | URL |
| --- | --- |
| Website | http://localhost:5173 |
| Enquire Now | http://localhost:5173/enquiry |
| Sign in (admin and staff) | http://localhost:5173/login |
| API health | http://localhost:9000/api/health |

The website deliberately has **no login or sign-up link**. Staff and admins go straight to `/login`.

### Default logins (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `ADMIN_SEED_EMAIL` (this project's `.env` uses `globaleducationgv@gmail.com`) | `ADMIN_SEED_PASSWORD` (this project's local `.env` uses `Admin@2026`) |
| Staff | `priya.staff@example.com` (also `rahul.staff@…`, `anita.staff@…`) | `Staff@12345` |

The seed creates 1 admin, 3 staff, 2 courses, 2 batches, 20 students, a week of attendance and fees that are paid, partial, pending and overdue. `npm run seed:admin` (in `backend/`) creates only the admin account, with no sample data: use it for production. **Change the admin password in any real environment.** Staff created from the admin panel get a one-time temporary password and must change it at first sign-in.

### Placeholder mode

If an environment variable still contains `your_` or `changeme`, that service is skipped with a clear warning in the log and the rest of the app keeps running:

| Not configured | What happens |
| --- | --- |
| `MONGODB_URI` | Database routes answer `503 SERVICE_NOT_CONFIGURED`; health still works |
| `JWT_*` secrets | Insecure development secrets are used (warning only in development) |
| `B2_*` | No uploads, receipts or CSV links (CSV is streamed directly instead) |
| `BREVO_*` | No emails sent; reminders are skipped, not logged as failed |

In `NODE_ENV=production` the server refuses to start without a real `MONGODB_URI`, strong (32+ character) JWT secrets and an https `APP_URL`. Admins can see which integrations are configured at `GET /api/admin/system/status` and on the Settings page. Values are never shown.

## 3. Tests

```bash
cd backend && npm test
```

Vitest + supertest + mongodb-memory-server (downloads a MongoDB binary on first run). 39 tests cover: role protection, refresh-token rotation and reuse detection, account lock-out, duplicate-attendance prevention (including concurrent submits), attendance percentage with holidays excluded, the staff edit window, partial payments and overpayment races, reminder rule matching, no duplicate reminders (sequential and concurrent runs), Brevo retry and failure handling, the website enquiry flow, and a walk through most admin and staff endpoints.

Frontend: `cd frontend && npx tsc --noEmit` type-checks the project.

## 4. Environment variables

Set these in `backend/.env` for development, and in the AppSail console for production. `backend/.env.example` lists them all with placeholder values. Never commit real values (`.env` is git-ignored).

| Variable | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT` | Mode and port. The server listens on `X_ZOHO_CATALYST_LISTEN_PORT`, else `PORT`, else `9000`, bound to `0.0.0.0` |
| `APP_URL` | Public URL of the app. The **only** allowed CORS origin and the base of links in emails |
| `APP_TIMEZONE`, `INSTITUTE_NAME` | `Asia/Kolkata`; the name shown in emails and receipts |
| `MONGODB_URI` | Atlas connection string, including the database name |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Two different random strings, 32+ characters (`openssl rand -hex 32`) |
| `COOKIE_DOMAIN` | Leave `localhost` or blank in development; your domain in production only if needed |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | The first admin created by `npm run seed` |
| `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_REGION`, `B2_ENDPOINT` | Backblaze B2 |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Brevo email |
| `CONTACT_RECEIVER_EMAIL` | Extra recipient for new-enquiry notifications (admins are always notified) |
| `GOOGLE_CLIENT_ID` | Optional. OAuth web client id (ends in `.apps.googleusercontent.com`) that turns on the "Continue with Google" button on the login page |
| `GROQ_API_KEY` | Optional AI key from console.groq.com. Several keys may be comma-separated: they are used as automatic fallbacks |
| `GROQ_MODEL`, `GROQ_FALLBACK_MODELS` | Main model and comma-separated backup models, tried in order when one is rate limited or retired |
| `GROQ_DAILY_LIMIT` | Our own cap on AI calls per day (default 400), so a free tier is never exhausted |
| `REMINDER_CRON_TIME` | Default daily reminder time `HH:mm` (IST). Editable later in Admin → Reminders |
| `PAYMENT_INSTRUCTIONS` (optional) | Text used for `{payment_instructions}` in reminder emails |

Frontend: only `BACKEND_URL` (used by the dev proxy; `frontend/.env.example`).

## 5. Set up the services

### MongoDB Atlas
1. Create a free **M0** cluster at cloud.mongodb.com.
2. Database Access: add a **dedicated user** with the `readWrite` role on the `global_edutech` database only.
3. Network Access: add AppSail's outbound IPs, or `0.0.0.0/0` together with a strong password (AppSail IPs are not fixed).
4. Connect → Drivers: copy the string into `MONGODB_URI` and add the database name: `mongodb+srv://USER:PASS@cluster.mongodb.net/global_edutech?retryWrites=true&w=majority`.

### Backblaze B2 (private bucket, application key, CORS)
1. Create a bucket and set **Files in Bucket are: Private**.
2. App Keys → Add a New Application Key, limited to that bucket with read and write access. Copy `keyID` to `B2_KEY_ID` and `applicationKey` to `B2_APPLICATION_KEY` (shown once).
3. The bucket page shows the endpoint, for example `s3.us-west-004.backblazeb2.com`. Set `B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com` and `B2_REGION=us-west-004`.
4. **CORS rule** (needed for browser uploads). Apply it with the B2 CLI (`b2 bucket update --cors-rules '<json>' <bucket> allPrivate`) or the bucket's CORS settings:

```json
[
  {
    "corsRuleName": "app-uploads",
    "allowedOrigins": ["https://YOUR-APP-URL", "http://localhost:5173"],
    "allowedOperations": ["s3_put", "s3_get", "s3_head"],
    "allowedHeaders": ["*"],
    "exposeHeaders": ["ETag"],
    "maxAgeSeconds": 3600
  }
]
```

How uploads work: the server checks type (JPG, PNG, PDF) and size (max 5 MB) and returns a 5-minute presigned PUT link; the browser uploads straight to B2; then `POST /api/files/confirm` re-checks the real object and deletes it if it breaks the rules. Downloads are 5-minute presigned links, authorised per owner (admin sees everything, staff only their own files and their students'). Key layout: `students/{id}/photo`, `students/{id}/docs/{uuid}`, `staff/{id}/docs/{uuid}`, `staff/{id}/avatar`, `receipts/{paymentId}.pdf`, `exports/{date}/{name}.csv`.

### Brevo (email)
1. Create an account at brevo.com. SMTP & API → **API Keys** → generate a v3 key → `BREVO_API_KEY`.
2. Senders & IP → add and **verify** the sender address → `BREVO_SENDER_EMAIL`. Unverified senders are rejected.
3. The free plan allows about 300 emails a day. The app stops at 280, queues sends with a short delay and retries a failed send once.

Brevo sends: fee reminders, the admin daily summary, password-reset links, staff login details and new-enquiry notifications.

## 6. Deploy to Zoho Catalyst AppSail

AppSail storage is **ephemeral**: the app never writes uploads to disk, everything goes to B2.

```bash
npm install -g zcatalyst-cli
catalyst login
catalyst init                         # in the repo root; pick your project and choose AppSail (Node.js)

npm run install:all                   # install frontend and backend dependencies
npm run deploy:build                  # static frontend -> backend/public, then ./appsail-build with production node_modules
# or do all of it (install, build, deploy) with one command:  bash deploy/appsail/deploy-appsail.sh   (npm run deploy:appsail)

catalyst deploy appsail --name global-edutech \
  --build-path "$(pwd)/appsail-build" --stack node22 --command "node src/index.js" -ni
```

- `--build-path` must be an **absolute path**.
- **Environment variables:** set them in the AppSail **console** (service → Configuration → Environment Variables) and deploy with the standalone command above. If you instead link the service (`catalyst appsail:add`) and deploy using `app-config.json`, the file's `env_variables` replace console values on every deploy, so do not mix the two. Set `NODE_ENV=production`, `APP_URL` (the AppSail URL or your custom domain), the secrets, Mongo, B2 and Brevo values.
- **Logs:** Catalyst console → AppSail → your service → Logs (or `catalyst logs`).
- The app must start listening within 10 seconds; it binds `0.0.0.0` on `X_ZOHO_CATALYST_LISTEN_PORT`.
- **Several instances are safe:** the reminder job takes a MongoDB lock (`JobLock`) and every reminder has a unique `(fee, rule, date)` record, so nothing is sent twice.
- Update `APP_URL`, the B2 CORS origin and the Brevo sender whenever the public URL changes.

Root scripts: `npm run build` (static frontend into `backend/public`), `npm run bundle` (create `appsail-build`), `npm run deploy:build` (both), `npm start` (run the API, which also serves the built site), `npm test`.

### Deploy with Docker (alternative)

`deploy/docker/Dockerfile` builds one image that serves the API and the website. Catalyst only accepts Linux AMD64 images, so the scripts build with `--platform linux/amd64`.

```bash
npm run docker:build      # docker build --platform linux/amd64 -f deploy/docker/Dockerfile -t globaledutech:latest .
npm run docker:deploy     # catalyst deploy appsail --name globaledutech --source docker://globaledutech:latest --port 9000 -ni
npm run docker:release    # both in one go
```

Docker deploys ignore `app-config.json`: set the environment variables in the AppSail console. Other helpers: `npm run docker:run` (run the image locally with `backend/.env`), and `npm run docker:up` (`docker-compose.yml`: local MongoDB + API on :9000 + website on :5173; seed with `docker compose -f deploy/docker/docker-compose.yml --profile tools run --rm seed`). `backend/Dockerfile` and `frontend/Dockerfile` build the two parts separately.

### Post-deploy checklist
1. `GET /api/health` returns `ok` with `"db": true`.
2. Create the admin: run `npm run seed` once against the production database, or insert an admin user. The seed also creates sample students and staff, so delete the `SEED…` records for a clean start.
3. Sign in at `/login`; Settings → System status shows MongoDB, B2 and Brevo as configured.
4. Create a course (with instalments), a batch and a student, and assign staff to the batch.
5. Sign in as staff (change the temporary password) and mark attendance on a phone.
6. Admin → Fees → Generate fees, record a payment, open the PDF receipt (checks B2).
7. Admin → Reminders → **Run daily job now**; check the log table.
8. Confirm the email in Brevo → Transactional → Logs.
9. Upload a student photo and a document (checks the B2 CORS rule).
10. Submit the Enquire Now form and see it under Admin → Enquiries.

## 6a. Sign in with Google (optional)

Admins and staff can use a "Continue with Google" button on `/login`. It only lets in people who already have an account: the verified Google email must match an active user an administrator created, nothing is ever created from Google, and a Google account that is not registered is refused. The first Google sign-in links that Google account to the user; a different Google account with the same email is then refused. Signing in with Google also clears a staff member's temporary-password step.

Setup (Google Cloud Console):
1. Create or pick a project at console.cloud.google.com, then **APIs & Services → OAuth consent screen**: user type External, app name Global Edutech, your support email, then publish the app (otherwise only listed test users can sign in).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorized JavaScript origins**: add `https://www.globaledutech.co.in`, `https://globaledutech.co.in`, your `https://…vercel.app` address if you use it, and `http://localhost:5173` for local work. No redirect URI is needed.
4. Copy the client id into `GOOGLE_CLIENT_ID` (backend `.env` and the AppSail console) and restart. Until it is set, the button stays hidden.

## 6b. AI features (optional, Groq)

Set `GROQ_API_KEY` to turn them on; everything works without it using built-in fallbacks.

| Feature | With AI | Fallback (no key, rate limit, daily cap, bad output) |
| --- | --- | --- |
| Website chat bubble (`POST /api/chat`) | Answers from the course data in the user's language | Keyword answers built from the same course data, with links |
| Enquiry triage (category, priority, summary) | AI classification | Keyword rules (also catches spam) |
| Admin → Enquiries → **Reply** | Drafts a WhatsApp/email reply in English, Tamil or Hindi | Built-in templates in all three languages |
| Admin → Reminders → email language + **Translate** | Translates your edited templates (placeholders are verified) | Built-in Tamil and Hindi templates |
| Admin dashboard "This week at a glance" | Plain-language summary of totals | Computed bullets from the same numbers |

Free-tier protection (`backend/src/services/ai/groq.service.js`): multiple keys and models are tried in order, a 429 puts that key and model on cooldown and moves on, rejected keys are switched off, retired models are skipped, answers are cached, a daily call cap applies, and a circuit breaker stops calling Groq for a minute after repeated failures. Nothing AI-written is sent to a parent automatically, and phone numbers and emails are never sent to Groq. Run `node scripts/build-knowledge.mjs` in `backend/` after editing `frontend/data/courses.ts` to refresh what the assistant knows.

## 7. Website enquiries

The **Enquire Now** buttons (header, course pages, home sections) open `/enquiry`. Course pages pass the course name (`/enquiry?course=…`) so the program is pre-selected. Submissions are saved to MongoDB and appear in **Admin → Enquiries**, where you can filter by status (New, Contacted, In progress, Enrolled, Closed), call or WhatsApp straight from a row, add notes and export CSV. The admin dashboard shows the number of new enquiries. With Brevo configured, all active admins (and `CONTACT_RECEIVER_EMAIL`) also get an email. The public endpoint is limited to 10 submissions per hour per visitor and every field is validated.

## 8. API overview

All responses are `{ success, data, meta? }` or `{ success:false, code, message, details }`. Lists return `meta: { page, limit, total, totalPages }`. `/api` is rate-limited, with stricter limits on login, password reset, enquiries and reminder triggers.

**Public** `GET /api/health`, `POST /api/submit-form` (enquiry)

**Auth** `POST /api/auth/login | refresh | logout | change-password | forgot-password | reset-password`, `GET /api/auth/me`

**Files** `POST /api/files/upload-url`, `POST /api/files/confirm`, `GET /api/files/download-url?key=`, `DELETE /api/files`

**Admin** (ADMIN only, prefix `/api/admin`)
- `GET /dashboard`, `GET /system/status`
- Enquiries: `GET /enquiries`, `PATCH|DELETE /enquiries/:id`
- Staff: `GET|POST /staff`, `GET|PATCH|DELETE /staff/:id`, `PATCH /staff/:id/status`, `POST /staff/:id/reset-password`
- Students: `GET|POST /students`, `GET|PATCH|DELETE /students/:id`, `POST /students/import` (CSV with a per-row error report)
- Courses and batches: `GET|POST /courses`, `PATCH|DELETE /courses/:id`, `GET|POST /batches`, `PATCH|DELETE /batches/:id`, `POST /batches/:id/assign-staff`, `POST /batches/:id/assign-students`
- `GET|POST|DELETE /holidays`, `GET|PATCH /settings`, `GET /audit-logs`
- Attendance oversight: `GET /attendance/staff`, `PATCH /attendance/staff/:id`, `GET /leaves`, `PATCH /leaves/:id`
- Reports: `GET /reports/attendance?type=student|batch|staff&from&to&format=json|csv`, `GET /reports/low-attendance`
- Fees: `GET|POST /fee-structures`, `POST /fees/generate`, `GET /fees`, `GET /fees/dashboard`, `GET /fees/:id`, `POST /fees/:id/payments`, `GET /payments`, `GET /payments/:id/receipt`
- Reminders: `GET|PATCH /reminders/settings`, `POST /reminders/send/:studentFeeId`, `POST /reminders/send-overdue`, `POST /reminders/run`, `GET /reminders/logs`

**Staff** (STAFF only, own data, prefix `/api/staff`) `GET /dashboard | batches | batches/:id/students | profile | attendance/me?month= | leaves | fees` (fees only when enabled in Settings), `PATCH /profile`, `POST /attendance/check-in | check-out`, `POST /leaves`

**Attendance** (ADMIN and STAFF; staff are limited to their assigned batches) `GET|POST /api/attendance/batch/:batchId`, `PATCH /api/attendance/:id`, `GET /api/attendance/student/:studentId?from=&to=`

## 9. Business rules worth knowing

- **Attendance:** `(Present + Late) / (Present + Late + Absent)`. Excused days, holidays and non-working days are excluded. Working days default to Mon-Sat (Settings). Marking is blocked on future dates and holidays. Staff can edit a record only within the edit window (default 24 hours), admins always can. Every correction is audit-logged. Saving uses a bulk upsert on a unique `(student, batch, date)` index, so duplicates cannot happen.
- **Staff check-in:** late if after shift start plus the grace minutes; total hours computed at check-out; under half a shift becomes Half Day.
- **Leaves:** working days are counted for you. Approving deducts the leave balance (guarded, it cannot go negative) and marks those days On Leave.
- **Fees:** status is Pending, Partial, Paid or Overdue, worked out automatically. A payment can never exceed the balance, even with simultaneous requests. Generating fees twice never duplicates instalments. Every payment is audit-logged and gets a numbered PDF receipt stored in B2.
- **Reminders:** D-7, D-3, D-1 (configurable), the due date, then the first overdue email immediately and one every N days up to a maximum (defaults 3 and 5). Paid fees are skipped. Both the student and parent emails receive it. Templates support `{student_name} {parent_name} {amount_due} {due_date} {course} {institute_name} {payment_instructions}`. A pluggable channel interface (`backend/src/services/reminders/channels.js`) lets you add WhatsApp or SMS later.
- **Deleting:** students, staff, courses and batches that have history cannot be deleted (HTTP 409). Set them to inactive instead.
- **Security:** every endpoint checks the role on the server, staff cannot reach admin routes, `$` and `.` keys are stripped from input, all input is validated with zod, deactivated accounts are signed out immediately, and nothing secret is ever logged.

## 10. Project notes and decisions

- Kept Next.js (not Vite) and the `frontend/` and `backend/` folder names.
- `bcryptjs` (pure JavaScript, same algorithm and cost) instead of native `bcrypt`, so AppSail needs no native build.
- Payments use an atomic guarded update instead of a multi-document transaction (this also works on a standalone MongoDB). It is tested against concurrent overpayment.
- Staff identifiers in the API and in storage keys are **user ids**.
- The daily email caps and the send queue are in memory (per process).
- `/api/admin/system/status` needs a working database and an admin sign-in, so it cannot report on an install with no database at all (the server log shows the same warnings at startup).
- The old username/password enquiry admin and the old Vercel serverless entry were removed. Enquiries from the old form that are still in the old Atlas database (`globaledutech`) are not shown in the new Enquiries screen.
- The Privacy Policy (`/privacy-policy`) and Terms of Service (`/terms-of-service`) were written from how this system actually handles data. Have a lawyer review them, and fill in your real retention periods, refund policy and a named grievance contact.

## 11. What to build next

- Parent portal with attendance and fee views, and SMS or WhatsApp reminders through the channel interface
- Online payments (for example Razorpay) with automatic receipts
- Timetable, exams and marks
- An admin-only production seed command (no sample data)
- Two-factor sign-in for admins
- Playwright end-to-end tests for the portal screens
- Import of enquiries from the old database
