FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
# Force cache invalidation - 2025-11-25
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/services/api-gateway/package.json ./backend/services/api-gateway/
COPY backend/services/auth-service/package.json ./backend/services/auth-service/
COPY backend/services/operations-service/package.json ./backend/services/operations-service/
COPY backend/services/tracking-service/package.json ./backend/services/tracking-service/
COPY backend/shared/auth/package.json ./backend/shared/auth/
COPY backend/shared/common/package.json ./backend/shared/common/
COPY backend/shared/mail/package.json ./backend/shared/mail/
COPY backend/shared/prisma/package.json ./backend/shared/prisma/
COPY frontend/web/package.json ./frontend/web/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Ensure tsconfig files are available for alias resolution
COPY tsconfig.base.json tsconfig.base.json
COPY frontend/web/tsconfig.json frontend/web/tsconfig.json
COPY . .

# Generate Prisma Clients (with Linux binaries)
# CRITICAL: Delete Mac-generated clients from ALL locations
RUN rm -rf node_modules/@aaron/prisma-client-auth || true
RUN rm -rf node_modules/@aaron/prisma-client-ops || true  
RUN rm -rf node_modules/@aaron/prisma-client-tracking || true
RUN rm -rf backend/node_modules/@aaron/prisma-client-auth || true
RUN rm -rf backend/node_modules/@aaron/prisma-client-ops || true
RUN rm -rf backend/node_modules/@aaron/prisma-client-tracking || true
RUN rm -rf node_modules/.prisma || true
RUN rm -rf backend/node_modules/.prisma || true
# Now regenerate with correct Linux binaries
RUN pnpm --filter @aaron/auth-service prisma:generate
RUN pnpm --filter @aaron/operations-service prisma:generate
RUN pnpm --filter @aaron/tracking-service prisma:generate
RUN pnpm --filter @aaron/prisma generate

# Build Shared Libraries First
RUN pnpm --filter @aaron/common build
RUN pnpm --filter @aaron/auth build
RUN pnpm --filter @aaron/mail build
RUN pnpm --filter @aaron/prisma build

# Refresh workspace links to pick up built artifacts
RUN pnpm install


# Build Frontend (Next.js Server)
# Google Maps Configuration (ARG para build-time, ENV para runtime)
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=${NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
RUN pnpm --filter @aaron/web build


# Build Backend Services
RUN pnpm --filter @aaron/api-gateway build
RUN pnpm --filter @aaron/auth-service build
RUN pnpm --filter @aaron/operations-service build
RUN pnpm --filter @aaron/tracking-service build

FROM base AS runner
WORKDIR /app

# Copy the ENTIRE workspace from builder (preserves all symlinks and structure)
COPY --from=builder /app ./
# Startup Script
COPY start-all.sh ./
RUN chmod +x start-all.sh

# Environment variables defaults
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["./start-all.sh"]
