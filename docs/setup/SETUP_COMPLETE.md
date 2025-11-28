# Setup Completo - Orden de Ejecución

## ✅ Verificación de Estados

### Prerequisitos Completados

- ✅ **Root Setup**: Monorepo con pnpm workspaces
- ✅ **Auth Service**: NestJS con endpoints completos
- ✅ **Operations Service**: NestJS con modelos Prisma
- ✅ **Tracking Service**: NestJS con WebSocket Gateway
- ✅ **API Gateway**: NestJS con reverse proxy y JWT guard
- ✅ **Prisma & Migrations**: Scripts configurados en todos los servicios
- ✅ **Docker**: Dockerfiles multi-stage y docker-compose.yml actualizado

## Orden de Ejecución

### 1. Iniciar Infraestructura

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

**Esperar ~5-10 segundos** para que los servicios estén listos.

Verificar:
```bash
docker compose -f infra/docker-compose.yml ps
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Si aún no tienes archivos `.env`, copia desde `.env.example`:

```bash
cp apps/auth-service/.env.example apps/auth-service/.env
cp apps/operations-service/.env.example apps/operations-service/.env
cp apps/tracking-service/.env.example apps/tracking-service/.env
cp apps/api-gateway/.env.example apps/api-gateway/.env
```

**Verifica** que `DATABASE_URL` en cada `.env` use `localhost:3307`:
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
bash scripts/migrate_all.sh
```

O si el script tiene permisos:
```bash
./scripts/migrate_all.sh
```

Este script ejecutará para cada servicio:
- `npx prisma migrate dev --name init`
- `npx prisma generate`

### 5. Iniciar Servicios en Desarrollo

Abre **4 terminales separadas** (o usa tmux/screen):

**Terminal 1 - Auth Service:**
```bash
pnpm --filter @aaron/auth-service dev
```

**Terminal 2 - Operations Service:**
```bash
pnpm --filter @aaron/operations-service dev
```

**Terminal 3 - Tracking Service:**
```bash
pnpm --filter @aaron/tracking-service dev
```

**Terminal 4 - API Gateway:**
```bash
pnpm --filter @aaron/api-gateway dev
```

**Espera ~10-15 segundos** para que todos estén listos.

### 6. Smoke Tests (cURL)

Espera a ver mensajes como `🚀 Auth Service running on port 3001` en cada terminal.

#### 6.1 Auth - Signup

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Esperado**: Status 201, JSON con `user`, `accessToken`, `refreshToken`.

#### 6.2 Auth - Signin

```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Esperado**: Status 200, JSON con `accessToken`, `refreshToken`.

**Guardar token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

#### 6.3 Operations - Crear Work Order

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

**Guardar order ID:**
```bash
ORDER_ID=$(curl -s -X POST http://localhost:3002/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "customer-123",
    "address": "Calle Falsa 123",
    "type": "plomería",
    "description": "Arreglo de cañería"
  }' | jq -r '.data.id')

echo "Order ID: $ORDER_ID"
```

#### 6.4 Operations - Cambiar Estado a "en_camino"

```bash
curl -X PATCH http://localhost:3002/work-orders/$ORDER_ID/state \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "state": "en_camino",
    "note": "Cuadrilla salió hacia destino"
  }'
```

**Esperado**: Status 200, JSON con `state: "en_camino"`.

#### 6.5 Tracking - Ping

```bash
curl -X POST http://localhost:3003/track/ping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "crewId": "crew-123",
    "orderId": "'$ORDER_ID'",
    "lat": -34.603722,
    "lng": -58.381592,
    "source": "hourly_api"
  }'
```

**Esperado**: Status 200, JSON con `_tag: "ok"`, `value` con datos del ping.

#### 6.6 Operations - Métricas Overview

```bash
curl -X GET http://localhost:3002/metrics/overview \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Status 200, JSON con métricas del servicio.

---

## Comandos Rápido (Copy-Paste)

```bash
# Setup completo
docker compose -f infra/docker-compose.yml up -d postgres redis && \
sleep 5 && \
pnpm install && \
bash scripts/migrate_all.sh && \
echo "✅ Setup completo. Ahora inicia los servicios en terminales separadas:"
echo "  Terminal 1: pnpm --filter @aaron/auth-service dev"
echo "  Terminal 2: pnpm --filter @aaron/operations-service dev"
echo "  Terminal 3: pnpm --filter @aaron/tracking-service dev"
echo "  Terminal 4: pnpm --filter @aaron/api-gateway dev"
```

---

## Verificación Final

Después de completar todos los pasos:

1. ✅ PostgreSQL y Redis corriendo: `docker compose -f infra/docker-compose.yml ps`
2. ✅ Servicios respondiendo:
   ```bash
   curl http://localhost:3000/health  # Gateway
   curl http://localhost:3001/health  # Auth
   curl http://localhost:3002/health  # Operations
   curl http://localhost:3003/health  # Tracking
   ```
3. ✅ Tablas creadas:
   ```bash
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt auth.*"
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt operations.*"
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt tracking.*"
   ```

---

## Troubleshooting

Ver `SETUP_PRISMA.md` y `DOCKER_SETUP.md` para troubleshooting detallado.

