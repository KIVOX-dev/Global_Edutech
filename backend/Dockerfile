# syntax=docker/dockerfile:1
# Global Edutech API (Express). Build from this folder:  docker build -t global-edutech-api .

# ---- 1. production dependencies only
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 2. runtime image
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY scripts ./scripts
# Optional: a built website in ./public is served by Express too (see the root Dockerfile)

# Never run as root. Uploads go to Backblaze B2, so nothing is written to disk.
USER node

# The app listens on X_ZOHO_CATALYST_LISTEN_PORT, else PORT, else 9000 (bound to 0.0.0.0)
ENV PORT=9000
EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.X_ZOHO_CATALYST_LISTEN_PORT||process.env.PORT||9000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Handles SIGTERM itself (graceful shutdown), so no init wrapper is needed
CMD ["node", "src/index.js"]
