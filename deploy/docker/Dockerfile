# syntax=docker/dockerfile:1
# ONE image that serves everything (API + built website), the same way AppSail runs it.
# Build from the repo root:  docker build -t global-edutech .
# Run:                       docker run --env-file backend/.env -p 9000:9000 global-edutech
# Needs real values for NODE_ENV=production (see README), or run with NODE_ENV=development.

# ---- 1. static website (Next export)
FROM node:22-alpine AS web
WORKDIR /web
ENV NEXT_TELEMETRY_DISABLED=1
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend ./
RUN npm run build:static

# ---- 2. API production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 3. runtime
FROM node:22-alpine AS runner
ENV NODE_ENV=production PORT=9000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY --from=web /web/out ./public
USER node
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.X_ZOHO_CATALYST_LISTEN_PORT||process.env.PORT||9000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/index.js"]
