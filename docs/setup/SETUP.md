# Guía de Setup Completo

Esta guía te llevará paso a paso desde la instalación inicial hasta tener todos los servicios funcionando.

## 1. Instalación Base (Raíz)

### Instalar pnpm (si no lo tienes)

```bash
pnpm i -g pnpm
# o
npm install -g pnpm
```

### Instalar dependencias del workspace

```bash
# Desde la raíz del proyecto
pnpm install
```

Esto instalará todas las dependencias de `apps/*` y `libs/*` definidas en el workspace.

## 2. Configuración de Variables de Entorno

```bash
# Setup rápido (copia .env.example a .env en todos los servicios)
pnpm env:setup

# Luego edita cada .env según tu entorno
# Ver ENV_SETUP.md para detalles
```

## 3. Setup por Servicio

### Auth Service

```bash
cd apps/auth-service

# Dependencias Express + Auth
pnpm add express jsonwebtoken bcrypt passport passport-google-oauth20 cors zod
pnpm add -D @types/express @types/jsonwebtoken @types/bcrypt @types/passport @types/passport-google-oauth20 @types/cors

# Prisma
pnpm add @prisma/client prisma
pnpm add -D prisma

# Resend (Mail)
pnpm add resend

# Inicializar Prisma (si aún no está hecho)
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajustar prisma/schema.prisma y DATABASE_URL en .env
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

# Redis (ioredis)
pnpm add ioredis

# Inicializar Prisma (si aún no está hecho)
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajustar prisma/schema.prisma y DATABASE_URL en .env
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

# Redis (ioredis)
pnpm add ioredis

# UUID (para generar IDs)
pnpm add uuid
pnpm add -D @types/uuid

# Inicializar Prisma (si aún no está hecho)
npx prisma init --datasource-provider postgresql

# IMPORTANTE: Ajustar prisma/schema.prisma y DATABASE_URL en .env
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

# El API Gateway usa NestJS, las dependencias ya están en package.json
# Solo necesitas instalar desde la raíz con pnpm install

# Para desarrollo con NestJS
pnpm dev
```

## 4. Setup de Base de Datos

### Crear Schemas en PostgreSQL

Antes de ejecutar migraciones, crear los schemas:

```bash
# Desde la raíz
pnpm schemas:create
```

O manualmente:

```bash
# Conectar a PostgreSQL
psql -h localhost -p 3307 -U app -d app

# Crear schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS tracking;
```

### Ejecutar Migraciones

```bash
# Desde la raíz - Ejecuta migraciones en todos los servicios
pnpm migrate:all

# O manualmente en cada servicio
cd apps/auth-service
npx prisma migrate dev

cd apps/operations-service
npx prisma migrate dev

cd apps/tracking-service
npx prisma migrate dev
```

## 5. Scripts Disponibles

### Desde la Raíz

```bash
# Instalar dependencias
pnpm install

# Setup de archivos .env
pnpm env:setup

# Crear schemas en PostgreSQL
pnpm schemas:create

# Ejecutar migraciones en todos los servicios
pnpm migrate:all

# Desarrollo (inicia todos los servicios)
pnpm dev
```

### Por Servicio

Cada servicio tiene sus propios scripts en `package.json`:

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Producción
pnpm start

# Prisma
pnpm prisma:generate    # Generar Prisma Client
pnpm prisma:migrate     # Ejecutar migraciones
pnpm prisma:studio      # Abrir Prisma Studio
```

## 6. Orden de Setup Recomendado

1. **Instalación base**
   ```bash
   pnpm install
   ```

2. **Configurar entorno**
   ```bash
   pnpm env:setup
   # Editar archivos .env según tu entorno
   ```

3. **Iniciar Docker (si usas Docker)**
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```

4. **Crear schemas**
   ```bash
   pnpm schemas:create
   ```

5. **Generar Prisma Clients**
   ```bash
   cd apps/auth-service && pnpm prisma:generate && cd ../..
   cd apps/operations-service && pnpm prisma:generate && cd ../..
   cd apps/tracking-service && pnpm prisma:generate && cd ../..
   ```

6. **Ejecutar migraciones**
   ```bash
   pnpm migrate:all
   ```

7. **Iniciar servicios**
   ```bash
   pnpm dev
   # O individualmente en cada servicio con pnpm dev
   ```

## 7. Troubleshooting

### Error: Prisma Client no encontrado

```bash
# En cada servicio
npx prisma generate
```

### Error: Schema no existe

```bash
# Crear schemas primero
pnpm schemas:create
```

### Error: Conexión a base de datos

- Verifica que PostgreSQL esté corriendo
- Verifica DATABASE_URL en .env
- Local: `localhost:3307`
- Docker: `postgres:5432`

### Error: Variables de entorno

- Asegúrate de que `.env` exista (no solo `.env.example`)
- Verifica que JWT_SECRET coincida entre servicios
- Verifica URLs de servicios (localhost vs service-name)

