# Verificación de Prisma & Migrations

## ✅ Estado de Verificación

### 1. Scripts de Prisma en package.json

**✅ auth-service:**
```json
{
  "scripts": {
    "prisma:format": "prisma format",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

**✅ operations-service:**
```json
{
  "scripts": {
    "prisma:format": "prisma format",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

**✅ tracking-service:**
```json
{
  "scripts": {
    "prisma:format": "prisma format",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

### 2. Carga de Variables de Entorno (dotenv)

**Todos los servicios NestJS** usan `ConfigModule.forRoot()` que carga automáticamente `.env`:

**✅ auth-service:**
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],  // ✅ Carga .env automáticamente
})
```

**✅ operations-service:**
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],  // ✅ Carga .env automáticamente
})
```

**✅ tracking-service:**
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],  // ✅ Carga .env automáticamente
})
```

**No se requiere `dotenv` explícito** - `ConfigModule` lo maneja automáticamente.

### 3. DATABASE_URL para Desarrollo Local

**Todos los servicios** deben usar `localhost:3307` en sus `.env`:

```bash
# auth-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=auth

# operations-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=operations

# tracking-service/.env
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=tracking
```

**Nota**: Los `.env.example` ya tienen estos valores configurados ✅

### 4. Script migrate_all.sh

**✅ Ubicación:** `scripts/migrate_all.sh`

**✅ Funcionalidad:**
- Itera sobre `auth-service`, `operations-service`, `tracking-service`
- Para cada servicio:
  - Ejecuta `npx prisma migrate dev --name init`
  - Ejecuta `npx prisma generate`
- Maneja errores y continúa con el siguiente servicio

**✅ Permisos:** Ejecutable (`chmod +x`)

---

## Comandos Exactos

### 1. Iniciar PostgreSQL y Redis

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Ejecutar Migraciones

```bash
./scripts/migrate_all.sh
```

O manualmente:
```bash
cd apps/auth-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
cd apps/operations-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
cd apps/tracking-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
```

### 4. Iniciar Servicios

```bash
# Terminal 1
pnpm --filter @aaron/api-gateway dev

# Terminal 2
pnpm --filter @aaron/auth-service dev

# Terminal 3
pnpm --filter @aaron/operations-service dev

# Terminal 4
pnpm --filter @aaron/tracking-service dev
```

### 5. Smoke Tests (cURL)

#### Health Checks

```bash
curl http://localhost:3000/health  # Gateway
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Operations
curl http://localhost:3003/health  # Tracking
```

#### Auth - Signup

```bash
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

#### Auth - Signin

```bash
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Guardar token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.accessToken')
```

#### Operations - Crear Work Order

```bash
curl -X POST http://localhost:3002/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "customer-123",
    "address": "Calle Falsa 123",
    "type": "plomería",
    "description": "Arreglo de cañería"
  }'
```

#### Tracking - Ping

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

---

## Resumen de Verificación

✅ Scripts de Prisma configurados en todos los servicios  
✅ ConfigModule carga `.env` automáticamente en todos los servicios  
✅ DATABASE_URL configurado para `localhost:3307` en `.env.example`  
✅ Script `migrate_all.sh` creado y funcional  
✅ Health endpoints agregados a todos los servicios  

**Todo está listo para ejecutar el setup completo** 🚀

