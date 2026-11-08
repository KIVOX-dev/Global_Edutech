#!/usr/bin/env bash
# Deploys Global Edutech (website + API) to Zoho Catalyst AppSail.
# Usage:  bash deploy/appsail/deploy-appsail.sh   (or: npm run deploy:appsail)
# Options (environment variables):
#   APPSAIL_NAME=global-edutech   AppSail service name
#   APPSAIL_STACK=node22          Node stack (node20 | node22 | node24)
#   SKIP_INSTALL=1                skip "npm ci" (use if dev servers are running)
set -euo pipefail

NAME="${APPSAIL_NAME:-global-edutech}"
STACK="${APPSAIL_STACK:-node22}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT_ABS="$(cd "$ROOT" && (pwd -W 2>/dev/null || pwd))"   # Windows-style path under Git Bash; the CLI needs an absolute path
cd "$ROOT"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing '$1'. $2"; exit 1; }; }
need node "Install Node 20 or newer."
need npm "Install Node 20 or newer."
need catalyst "Install it with: npm install -g zcatalyst-cli"

[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || { echo "Node 20+ is required."; exit 1; }
[ -f catalyst.json ] || { echo "No catalyst.json here. Run 'catalyst login' then 'catalyst init' in $ROOT first (choose your project and AppSail)."; exit 1; }

echo "==> 1/4 Installing dependencies"
if [ "${SKIP_INSTALL:-0}" = "1" ]; then echo "    skipped (SKIP_INSTALL=1)"; else npm run install:all; fi

echo "==> 2/4 Building the static website and the AppSail bundle"
npm run deploy:build

echo "==> 3/4 Deploying '$NAME' ($STACK) to Catalyst AppSail"
catalyst deploy appsail \
  --name "$NAME" \
  --build-path "$ROOT_ABS/appsail-build" \
  --stack "$STACK" \
  --command "node src/index.js" \
  -ni

echo "==> 4/4 Done"
cat <<MSG

Next steps (first deploy only):
  1. Catalyst console -> AppSail -> $NAME -> Configuration -> Environment Variables.
     Set: NODE_ENV=production, APP_URL, MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
          B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET, B2_REGION, B2_ENDPOINT,
          BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, REMINDER_CRON_TIME,
          INSTITUTE_NAME, APP_TIMEZONE=Asia/Kolkata, COOKIE_DOMAIN (only for a custom domain)
  2. Restart the service, then open <APP_URL>/api/health  (expect "db": true).
  3. Create the admin (npm run seed with the production MONGODB_URI, or insert a user), then sign in at <APP_URL>/login.
  4. Logs: catalyst console -> AppSail -> $NAME -> Logs
MSG
