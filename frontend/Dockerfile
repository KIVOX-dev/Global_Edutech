# syntax=docker/dockerfile:1
# Global Edutech website + admin/staff screens (Next.js standalone server).
# Build from this folder:
#   docker build -t global-edutech-web --build-arg BACKEND_URL=http://backend:9000 .
# BACKEND_URL is where the API runs; Next proxies /api/* to it (baked in at build time).

# ---- 1. install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- 2. build
FROM node:22-alpine AS builder
WORKDIR /app
ARG BACKEND_URL=http://backend:9000
ENV BACKEND_URL=${BACKEND_URL} \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# sharp gives Next its fast image optimiser in the standalone server (not saved to package.json)
RUN npm install --no-save --no-audit --no-fund sharp && npm run build

# ---- 3. minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
