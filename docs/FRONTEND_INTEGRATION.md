# Integración de Next.js 16 en el Monorepo

## Recomendación: Monorepo ✅

**Ventajas:**
- ✅ Compartir tipos TypeScript entre frontend y backend
- ✅ Desarrollo simplificado: un solo comando para todo
- ✅ Docker Compose puede orquestar todo junto
- ✅ CI/CD más simple: un solo pipeline
- ✅ Versionado conjunto: cambios coordinados

## 🚀 Recomendación: Usar Turbo Repo

Para optimizar builds y desarrollo, **recomendamos migrar a Turbo Repo**. Ver [`MONOREPO_TOOLS_COMPARISON.md`](./MONOREPO_TOOLS_COMPARISON.md) para detalles.

## Estructura Propuesta (Dos Opciones)

### Opción 1: Frontend en `apps/` (Tradicional)

```
/
├── apps/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── operations-service/
│   ├── tracking-service/
│   └── web/                    # ← Next.js 16
│       ├── app/
│       ├── package.json
│       └── Dockerfile
│
├── libs/
│   └── shared/                 # Tipos compartidos
│
└── infra/
    └── docker-compose.yml
```

### Opción 2: Frontend Separado ✅ **RECOMENDADO**

```
/
├── apps/                       # Backend services
│   ├── api-gateway/
│   ├── auth-service/
│   ├── operations-service/
│   └── tracking-service/
│
├── frontend/                   # ← Frontend separado
│   └── web/                    # Next.js 16
│       ├── app/
│       ├── package.json
│       └── Dockerfile
│
├── libs/                       # Shared libraries
│   ├── common/
│   ├── auth/
│   └── shared/
│
└── infra/
    └── docker-compose.yml
```

**Ventajas de frontend separado:**
- ✅ Mejor organización visual
- ✅ Separación clara frontend/backend
- ✅ Más fácil de entender para nuevos desarrolladores
- ✅ Funciona perfectamente con Turbo Repo

## Configuración

### 1. Crear app Next.js

```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 2. Actualizar `pnpm-workspace.yaml`

**Si frontend en `apps/`:**
```yaml
packages:
  - 'apps/*'
  - 'libs/*'
```

**Si frontend separado en `frontend/`:**
```yaml
packages:
  - 'apps/*'
  - 'frontend/*'      # ← Agregar esta línea
  - 'libs/*'
```

### 3. Configurar Next.js para Monorepo

**`apps/web/next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para monorepo
  transpilePackages: ['@aaron/shared'],
  
  // Variables de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003',
  },
  
  // Rewrites para desarrollo (opcional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

**`apps/web/tsconfig.json`:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@aaron/shared": ["../../libs/shared/src"],
      "@aaron/shared/*": ["../../libs/shared/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. Crear librería compartida para tipos

**`libs/shared/package.json`:**

```json
{
  "name": "@aaron/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

**`libs/shared/src/index.ts`:**

```typescript
// Exportar tipos compartidos
export * from './types';
export * from './api';
```

**`libs/shared/src/types/index.ts`:**

```typescript
// Tipos compartidos entre frontend y backend
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Re-exportar tipos de DTOs si es necesario
```

### 5. Actualizar `tsconfig.base.json`

```json
{
  "compilerOptions": {
    // ... existing config ...
    "paths": {
      "@aaron/common": ["libs/common/src"],
      "@aaron/common/*": ["libs/common/src/*"],
      "@aaron/auth": ["libs/auth/src"],
      "@aaron/auth/*": ["libs/auth/src/*"],
      "@aaron/mail": ["libs/mail/src"],
      "@aaron/mail/*": ["libs/mail/src/*"],
      "@aaron/prisma": ["libs/prisma/src"],
      "@aaron/prisma/*": ["libs/prisma/src/*"],
      "@aaron/shared": ["libs/shared/src"],
      "@aaron/shared/*": ["libs/shared/src/*"]
    }
  }
}
```

### 6. Actualizar Docker Compose

**`infra/docker-compose.yml`:**

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: pg_local
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "3307:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    container_name: redis_local
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  # Backend Services
  auth-service:
    build:
      context: ..
      dockerfile: apps/auth-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/app?schema=auth
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  operations-service:
    build:
      context: ..
      dockerfile: apps/operations-service/Dockerfile
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/app?schema=operations
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  tracking-service:
    build:
      context: ..
      dockerfile: apps/tracking-service/Dockerfile
    ports:
      - "3003:3003"
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/app?schema=tracking
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  api-gateway:
    build:
      context: ..
      dockerfile: apps/api-gateway/Dockerfile
    ports:
      - "3000:3000"
    environment:
      AUTH_URL: http://auth-service:3001
      OPS_URL: http://operations-service:3002
      TRACK_URL: http://tracking-service:3003
    depends_on:
      - auth-service
      - operations-service
      - tracking-service

  # Frontend - Next.js 16
  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    ports:
      - "3004:3000"  # Next.js corre en 3000 dentro del container
    environment:
      NEXT_PUBLIC_API_URL: http://api-gateway:3000
      NEXT_PUBLIC_WS_URL: ws://tracking-service:3003
      NODE_ENV: production
    depends_on:
      - api-gateway
    # Para desarrollo, usar volumen en lugar de build
    # volumes:
    #   - ../apps/web:/app
    #   - /app/node_modules
    #   - /app/.next
```

### 7. Dockerfile para Next.js

**`apps/web/Dockerfile`:**

```dockerfile
# Multi-stage build para Next.js
FROM node:20-alpine AS base

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copiar archivos de workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY libs ./libs
COPY apps/web ./apps/web

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de librerías compartidas primero
RUN pnpm --filter @aaron/shared build || true

# Build de Next.js
WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar solo lo necesario
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

WORKDIR /app/apps/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Nota:** Necesitas habilitar `output: 'standalone'` en `next.config.js`:

```javascript
const nextConfig = {
  output: 'standalone', // Para Docker
  // ... resto de config
};
```

### 8. Actualizar scripts

**`scripts/dev.sh`:**

```bash
#!/usr/bin/env bash

set -e

# Iniciar todos los servicios en paralelo
pnpm --filter @aaron/auth-service dev &
pnpm --filter @aaron/operations-service dev &
pnpm --filter @aaron/tracking-service dev &
pnpm --filter @aaron/api-gateway dev &
pnpm --filter @aaron/web dev &  # ← Nuevo

# Esperar a que todos los procesos terminen
wait
```

**`package.json` (root):**

```json
{
  "scripts": {
    "dev": "bash scripts/dev.sh",
    "dev:web": "pnpm --filter @aaron/web dev",
    "build": "pnpm --filter \"./apps/*\" build",
    "build:web": "pnpm --filter @aaron/web build",
    // ... resto de scripts
  }
}
```

### 9. Variables de Entorno

**`apps/web/.env.example`:**

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3003

# Next.js
NODE_ENV=development
PORT=3004
```

## Puertos Recomendados

- **3000**: API Gateway
- **3001**: Auth Service
- **3002**: Operations Service
- **3003**: Tracking Service (WebSocket)
- **3004**: Web (Next.js) ✅ **Recomendado**

## Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo (todos los servicios)
pnpm dev

# Solo frontend
pnpm dev:web

# Build de todo
pnpm build

# Docker Compose (todo junto)
docker compose -f infra/docker-compose.yml up -d
```

## Ventajas de esta Estructura

1. **Tipos Compartidos**: Frontend y backend comparten interfaces
2. **Hot Reload**: Cambios en libs se reflejan automáticamente
3. **Un Solo Repo**: Facilita PRs que afectan frontend y backend
4. **Docker Orquestado**: Todo levantado con un comando
5. **CI/CD Simple**: Un solo pipeline para todo

## Consideraciones

- **Build Times**: Pueden ser más lentos, pero pnpm ayuda con cache
- **Node Version**: Asegúrate de usar Node 20+ para Next.js 16
- **Memory**: Monorepo puede usar más memoria, pero es manejable

## Alternativa: Repo Separado

Si decides hacer repo separado, considera:
- Compartir tipos vía npm package privado
- Sincronizar versiones manualmente
- CI/CD separados (más complejo)

**Recomendación final: Monorepo ✅**

