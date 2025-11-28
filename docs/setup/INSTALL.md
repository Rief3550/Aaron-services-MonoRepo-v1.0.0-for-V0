# Comandos de Instalación

Guía paso a paso de instalación y setup inicial.

## 1. Workspace Configuration

El archivo `pnpm-workspace.yaml` ya está configurado:

```yaml
packages:
  - "apps/*"
  - "libs/*"
```

## 2. Instalación Base (Raíz)

```bash
# Instalar pnpm globalmente (si no lo tienes)
npm install -g pnpm
# o
pnpm i -g pnpm

# Instalar todas las dependencias del workspace
pnpm install
```

Esto instalará todas las dependencias de `apps/*` y `libs/*` automáticamente.

## 3. Setup por Servicio

### Auth Service

```bash
cd apps/auth-service

# Dependencias ya instaladas por pnpm install, pero si necesitas agregar algo:
# Express + Auth
pnpm add express jsonwebtoken bcrypt passport passport-google-oauth20 cors zod
pnpm add -D @types/express @types/jsonwebtoken @types/bcrypt @types/passport @types/passport-google-oauth20 @types/cors

# Prisma (ya en package.json, pero asegúrate)
pnpm add @prisma/client prisma
pnpm add -D prisma

# Resend (Mail)
pnpm add resend

# Prisma setup (si aún no está inicializado)
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajusta prisma/schema.prisma y DATABASE_URL en .env
# DATABASE_URL debe incluir: ?schema=auth

# Generar Prisma Client
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init_auth

# Desarrollo
pnpm dev
```

### Operations Service

```bash
cd apps/operations-service

# Dependencias Express
pnpm add express cors zod express-rate-limit
pnpm add -D @types/express @types/cors

# Prisma
pnpm add @prisma/client prisma
pnpm add -D prisma

# Redis
pnpm add ioredis

# Prisma setup
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajusta prisma/schema.prisma y DATABASE_URL en .env
# DATABASE_URL debe incluir: ?schema=operations

# Generar Prisma Client
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init_operations

# Desarrollo
pnpm dev
```

### Tracking Service

```bash
cd apps/tracking-service

# Dependencias Express + WebSocket
pnpm add express express-ws ws cors zod
pnpm add -D @types/express @types/ws @types/cors

# Prisma
pnpm add @prisma/client prisma
pnpm add -D prisma

# JWT (para validar tokens WebSocket)
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken

# Redis
pnpm add ioredis

# UUID
pnpm add uuid
pnpm add -D @types/uuid

# Prisma setup
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajusta prisma/schema.prisma y DATABASE_URL en .env
# DATABASE_URL debe incluir: ?schema=tracking

# Generar Prisma Client
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init_tracking

# Desarrollo
pnpm dev
```

### API Gateway

```bash
cd apps/api-gateway

# API Gateway usa NestJS - dependencias ya están en package.json
# Si necesitas instalar manualmente:
# pnpm install

# Desarrollo (NestJS usa nest start)
pnpm dev
```

## 4. Scripts Útiles

### Desde la Raíz

```bash
# Generar Prisma Client en todos los servicios
pnpm prisma:generate

# Ejecutar migraciones en todos los servicios
pnpm migrate:all

# Crear schemas en PostgreSQL
pnpm schemas:create
```

### Por Servicio

Cada servicio tiene scripts en su `package.json`:

```bash
# Auth Service
cd apps/auth-service
pnpm prisma:generate    # Generar Prisma Client
pnpm prisma:migrate     # Ejecutar migraciones
pnpm prisma:studio      # Abrir Prisma Studio
pnpm dev                # Desarrollo

# Operations Service
cd apps/operations-service
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
pnpm dev

# Tracking Service
cd apps/tracking-service
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
pnpm dev
```

## 5. Orden Completo de Setup

```bash
# 1. Instalación base
npm install -g pnpm
pnpm install

# 2. Configurar variables de entorno
pnpm env:setup
# Editar cada .env según tu entorno

# 3. Iniciar servicios de infraestructura (Docker)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 4. Crear schemas en PostgreSQL
pnpm schemas:create

# 5. Generar Prisma Clients
pnpm prisma:generate

# 6. Ejecutar migraciones (creará las iniciales si no existen)
pnpm migrate:all

# 7. Verificar con Prisma Studio (opcional)
cd apps/auth-service && pnpm prisma:studio

# 8. Iniciar servicios en desarrollo
pnpm dev
```

## 6. Notas Importantes

### Prisma Schemas

Cada servicio tiene su propio schema Prisma en:
- `apps/auth-service/prisma/schema.prisma` → schema `auth`
- `apps/operations-service/prisma/schema.prisma` → schema `operations`
- `apps/tracking-service/prisma/schema.prisma` → schema `tracking`

### DATABASE_URL

La `DATABASE_URL` en cada `.env` debe incluir el parámetro `?schema=SCHEMA_NAME`:

```bash
# Ejemplo para auth-service
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=auth
```

### Primera Migración

Si es la primera vez que ejecutas `pnpm migrate:all`, creará automáticamente las migraciones iniciales con nombres como:
- `init_auth-service`
- `init_operations-service`
- `init_tracking-service`

### Dependencias del Workspace

Las dependencias compartidas (`@aaron/common`, `@aaron/auth`, etc.) se instalan automáticamente con `pnpm install` desde la raíz gracias al workspace.

