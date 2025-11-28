# syntax=docker/dockerfile:1.4
# Multi-stage build for api-gateway (NestJS) with Turbo Repo

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files (for dependency resolution)
COPY backend/services/api-gateway/package.json ./backend/services/api-gateway/
COPY backend/shared/*/package.json ./backend/shared/*/
COPY shared/types/package.json ./shared/types/

# Install dependencies (with BuildKit cache)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile

# Stage 2: Build with Turbo
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/shared ./backend/shared

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy source code
COPY backend/services/api-gateway ./backend/services/api-gateway
COPY backend/shared ./backend/shared
COPY shared ./shared

# Install Turbo (if not in deps)
RUN pnpm add -D -w turbo || true

# Build with Turbo (with cache)
WORKDIR /app
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo run build --filter=@aaron/api-gateway

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=build /app/backend/services/api-gateway/dist ./dist
COPY --from=build /app/backend/services/api-gateway/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
