# 🚀 Quickstart - Inicio Rápido

Guía paso a paso para arrancar el monorepo de Aaron Backend Services.

## Prerrequisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker y Docker Compose (para PostgreSQL y Redis)

## Paso 1: Instalar Dependencias

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

# Instalar todas las dependencias del monorepo
pnpm install
```

## Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivos .env.example a .env (si no existen)
pnpm env:setup

# O manualmente para cada servicio:
cd apps/auth-service && cp .env.example .env
cd ../operations-service && cp .env.example .env
cd ../tracking-service && cp .env.example .env
cd ../api-gateway && cp .env.example .env
cd ../..
```

**⚠️ IMPORTANTE**: Edita cada `.env` con los valores correctos (JWT secrets, API keys, etc.)

## Paso 3: Levantar PostgreSQL y Redis

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

Verifica que estén corriendo:
```bash
docker ps
# Deberías ver: pg_local y redis_local
```

**Conexión PostgreSQL**: `localhost:3307`
- Database: `app`
- User: `app`
- Password: `app`

**Redis**: `localhost:6379`

## Paso 4: Crear Schemas en PostgreSQL

```bash
# Crear los schemas (auth, operations, tracking)
pnpm schemas:create

# O manualmente:
bash scripts/create_schemas.sh
```

## Paso 5: Inicializar Prisma por Servicio

### Auth Service
```bash
cd apps/auth-service
npx prisma migrate dev --name init_auth
npx prisma generate
cd ../..
```

### Operations Service
```bash
cd apps/operations-service
npx prisma migrate dev --name init_ops
npx prisma generate
cd ../..
```

### Tracking Service
```bash
cd apps/tracking-service
npx prisma migrate dev --name init_track
npx prisma generate
cd ../..
```

**O ejecutar todos a la vez:**
```bash
pnpm migrate:all
pnpm prisma:generate
```

## Paso 6: Arrancar Servicios en Desarrollo

Abre **4 terminales diferentes** (uno por servicio):

### Terminal 1 - Auth Service
```bash
pnpm --filter @aaron/auth-service dev
# O: cd apps/auth-service && pnpm dev
```

### Terminal 2 - Operations Service
```bash
pnpm --filter @aaron/operations-service dev
# O: cd apps/operations-service && pnpm dev
```

### Terminal 3 - Tracking Service
```bash
pnpm --filter @aaron/tracking-service dev
# O: cd apps/tracking-service && pnpm dev
```

### Terminal 4 - API Gateway
```bash
pnpm --filter @aaron/api-gateway dev
# O: cd apps/api-gateway && pnpm dev
```

## Paso 7: Verificar que Todo Funciona

### Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Operations Service
curl http://localhost:3002/health

# Tracking Service
curl http://localhost:3003/health
```

### Probar Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

## Estructura de Puertos

| Servicio | Puerto | URL Base |
|----------|--------|----------|
| API Gateway | 3000 | http://localhost:3000 |
| Auth Service | 3001 | http://localhost:3001 |
| Operations Service | 3002 | http://localhost:3002 |
| Tracking Service | 3003 | http://localhost:3003 |
| PostgreSQL | 3307 | localhost:3307 |
| Redis | 6379 | localhost:6379 |

## Comandos Útiles

```bash
# Ver logs de Docker
docker compose -f infra/docker-compose.yml logs -f

# Detener PostgreSQL y Redis
docker compose -f infra/docker-compose.yml stop postgres redis

# Detener y eliminar contenedores
docker compose -f infra/docker-compose.yml down

# Limpiar volúmenes (⚠️ borra datos)
docker compose -f infra/docker-compose.yml down -v

# Ejecutar Prisma Studio (base de datos visual)
cd apps/auth-service && npx prisma studio

# Ejecutar smoke E2E test (requiere servicios corriendo)
pnpm smoke:e2e
```

## Resumen del Flujo Completo

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar .env
pnpm env:setup

# 3. Levantar infraestructura
docker compose -f infra/docker-compose.yml up -d postgres redis

# 4. Crear schemas
pnpm schemas:create

# 5. Migraciones Prisma
pnpm migrate:all
pnpm prisma:generate

# 6. Arrancar servicios (en terminales separadas)
pnpm --filter @aaron/auth-service dev
pnpm --filter @aaron/operations-service dev
pnpm --filter @aaron/tracking-service dev
pnpm --filter @aaron/api-gateway dev
```

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo: `docker ps`
- Verifica `DATABASE_URL` en `.env` (debe apuntar a `localhost:3307` desde fuera de Docker)

### Error: "Schema does not exist"
- Ejecuta `pnpm schemas:create` antes de las migraciones

### Error: "Port already in use"
- Verifica qué proceso está usando el puerto: `lsof -i :3000`
- Cambia el puerto en el `.env` del servicio

### Error: "Prisma Client not generated"
- Ejecuta `pnpm prisma:generate` en el servicio correspondiente

## Próximos Pasos

1. Crear un usuario admin (ver `SETUP.md`)
2. Configurar roles y permisos
3. Ejecutar smoke test: `pnpm smoke:e2e`
4. Revisar documentación: `README.md`, `MODULES.md`
