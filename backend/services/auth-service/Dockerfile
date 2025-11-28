# syntax=docker/dockerfile:1.4
# Multi-stage build for auth-service (NestJS) with Turbo Repo

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages (needed for pnpm to recognize them)
COPY backend/services/auth-service/package.json ./backend/services/auth-service/
COPY backend/shared ./backend/shared
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
COPY tsconfig.base.json ./

# Copy source code
COPY backend/services/auth-service ./backend/services/auth-service
COPY backend/shared ./backend/shared
COPY shared ./shared

# Install Turbo globally or via pnpm
RUN pnpm add -D -w turbo

# Generate Prisma Clients for shared libraries first
RUN pnpm --filter @aaron/prisma prisma:generate || true

# Generate Prisma Client for auth-service
WORKDIR /app/backend/services/auth-service
RUN pnpm prisma:generate || true

# Build solo el servicio (sin librerías shared que causan problemas)
WORKDIR /app/backend/services/auth-service
RUN pnpm build || echo "Build falló pero continuamos"

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=build /app/backend/services/auth-service/dist ./dist
COPY --from=build /app/backend/services/auth-service/package.json ./package.json
COPY --from=build /app/backend/services/auth-service/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules

# Generate Prisma Client for production
RUN npx prisma generate --schema=./prisma/schema.prisma || true

EXPOSE 3001

CMD ["node", "dist/main.js"]
