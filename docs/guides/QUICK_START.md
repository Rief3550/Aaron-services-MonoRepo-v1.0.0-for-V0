# Quick Start Guide - Comandos Exactos

Guía rápida para levantar todo el proyecto desde cero.

## Prerrequisitos

- Docker y Docker Compose instalados
- pnpm instalado (`npm install -g pnpm`)
- Node.js 20+

## Pasos Completos (Copy-Paste)

### 1. Iniciar PostgreSQL y Redis

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

**Verificar que están corriendo:**
```bash
docker compose -f infra/docker-compose.yml ps
```

Debes ver `postgres` y `redis` con estado `Up`.

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Copia los `.env.example` a `.env` en cada servicio:

```bash
# Auth Service
cp apps/auth-service/.env.example apps/auth-service/.env

# Operations Service
cp apps/operations-service/.env.example apps/operations-service/.env

# Tracking Service
cp apps/tracking-service/.env.example apps/tracking-service/.env

# API Gateway
cp apps/api-gateway/.env.example apps/api-gateway/.env
```

**Importante**: Verifica que `DATABASE_URL` en cada `.env` use `localhost:3307`:

```bash
# auth-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=auth

# operations-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=operations

# tracking-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=tracking
```

### 4. Ejecutar Migraciones

```bash
./scripts/migrate_all.sh
```

Este script ejecuta para cada servicio:
- `npx prisma migrate dev --name init`
- `npx prisma generate`

**Esperado**: Verás mensajes de éxito para `auth-service`, `operations-service`, y `tracking-service`.

### 5. Iniciar Servicios

Abre 4 terminales separadas (o usa tmux/screen):

**Terminal 1 - API Gateway:**
```bash
pnpm --filter @aaron/api-gateway dev
```

**Terminal 2 - Auth Service:**
```bash
pnpm --filter @aaron/auth-service dev
```

**Terminal 3 - Operations Service:**
```bash
pnpm --filter @aaron/operations-service dev
```

**Terminal 4 - Tracking Service:**
```bash
pnpm --filter @aaron/tracking-service dev
```

**Espera ~10-15 segundos** para que todos los servicios estén listos.

### 6. Smoke Tests (cURL)

#### 6.1 Verificar Health Checks

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

Todos deberían responder con `{"status":"ok",...}`.

#### 6.2 Auth Service - Signup

```bash
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Esperado**: Status 201, JSON con `user`, `accessToken`, `refreshToken`.

#### 6.3 Auth Service - Signin

```bash
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Esperado**: Status 200, JSON con `accessToken`, `refreshToken`.

**Guardar el token para siguientes requests:**
```bash
# Guardar token en variable (requiere jq)
TOKEN=$(curl -s -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.accessToken')

echo $TOKEN
```

#### 6.4 Operations Service - Crear Work Order

```bash
curl -X POST http://localhost:3002/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "customer-123",
    "address": "Calle Falsa 123, Buenos Aires",
    "type": "plomería",
    "description": "Arreglo de cañería rota"
  }'
```

**Esperado**: Status 201, JSON con `id`, `state: "pendiente"`, etc.

#### 6.5 Tracking Service - Ping

```bash
curl -X POST http://localhost:3003/track/ping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "crewId": "crew-123",
    "orderId": "order-123",
    "lat": -34.603722,
    "lng": -58.381592,
    "source": "hourly_api"
  }'
```

**Esperado**: Status 200, JSON con `_tag: "ok"`, `value` con `id`, `crewId`, etc.

---

## Comandos en una Línea

```bash
# Setup completo
docker compose -f infra/docker-compose.yml up -d postgres redis && \
pnpm install && \
cp apps/auth-service/.env.example apps/auth-service/.env && \
cp apps/operations-service/.env.example apps/operations-service/.env && \
cp apps/tracking-service/.env.example apps/tracking-service/.env && \
cp apps/api-gateway/.env.example apps/api-gateway/.env && \
./scripts/migrate_all.sh
```

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

Ejecutar `prisma generate` manualmente:
```bash
cd apps/auth-service && npx prisma generate && cd ../..
cd apps/operations-service && npx prisma generate && cd ../..
cd apps/tracking-service && npx prisma generate && cd ../..
```

### Error: "Failed to connect to database"

1. Verificar que PostgreSQL está corriendo:
   ```bash
   docker compose -f infra/docker-compose.yml ps postgres
   ```

2. Verificar que el puerto 3307 está libre:
   ```bash
   lsof -i :3307
   ```

3. Verificar conexión:
   ```bash
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "SELECT 1;"
   ```

### Error: "Schema does not exist"

Crear schemas manualmente:
```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app <<EOF
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS tracking;
EOF
```

Luego ejecutar `./scripts/migrate_all.sh` nuevamente.

### Error: "Port already in use"

Detener servicios que usan los puertos:
```bash
# Ver qué usa los puertos
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003

# Matar procesos si es necesario (CUIDADO)
kill -9 <PID>
```

### Migraciones ya aplicadas

Si necesitas reiniciar las migraciones:

```bash
# ⚠️ CUIDADO: Esto borrará todas las migraciones
for svc in auth-service operations-service tracking-service; do
  rm -rf apps/$svc/prisma/migrations
done

# Ejecutar migraciones nuevamente
./scripts/migrate_all.sh
```

---

## Verificación Final

Después de completar todos los pasos:

```bash
# 1. Verificar servicios corriendo
ps aux | grep "nest start"

# 2. Health checks
curl http://localhost:3000/health && echo ""
curl http://localhost:3001/health && echo ""
curl http://localhost:3002/health && echo ""
curl http://localhost:3003/health && echo ""

# 3. Verificar tablas en DB
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt auth.*"
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt operations.*"
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt tracking.*"
```

Todos los checks deberían pasar ✅

