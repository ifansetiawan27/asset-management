# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Salin manifest monorepo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (workspace-aware, skip scripts)
RUN npm ci --ignore-scripts

# Salin source API
COPY apps/api ./apps/api

# Build NestJS
RUN npm run build -w @ams/api

# ── Stage 2: Production runtime ─────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Salin hasil build + node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "apps/api/dist/main.js"]
