# Setup Completo: Prisma & Migrations

Esta guía describe el proceso completo para configurar Prisma y ejecutar migraciones en todos los servicios.

## Verificación de Configuración

### ✅ Scripts de Prisma

Cada servicio debe tener estos scripts en su `package.json`:

```json
{
  "scripts": {
    "prisma:format": "prisma format",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

**Verificación**: Todos los servicios (`auth-service`, `operations-service`, `tracking-service`) ya tienen estos scripts configurados ✅

### ✅ Carga de Variables de Entorno

**NestJS Services** (usando `@nestjs/config`):
- `ConfigModule.forRoot()` carga automáticamente `.env` desde el directorio del servicio
- No requiere `dotenv` explícito en `main.ts`

**Verificación**:
- ✅ `auth-service`: Usa `ConfigModule.forRoot({ envFilePath: ['.env'] })`
- ✅ `operations-service`: Usa `ConfigModule.forRoot({ envFilePath: ['.env'] })`
- ✅ `tracking-service`: Usa `ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] })`

### ✅ DATABASE_URL para Desarrollo Local

Todos los servicios deben usar `localhost:3307` en desarrollo local:

```bash
# auth-service
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=auth

# operations-service
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=operations

# tracking-service
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=tracking
```

**Nota**: En Docker, usar `postgres:5432` en lugar de `localhost:3307`.

---

## Pasos de Setup

### 1. Iniciar PostgreSQL y Redis

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

Esperar ~5 segundos para que los servicios estén listos.

Verificar:
```bash
docker compose -f infra/docker-compose.yml ps
```

### 2. Instalar Dependencias

```bash
# Desde la raíz del proyecto
pnpm install
```

### 3. Ejecutar Migraciones

```bash
# Opción A: Usar el script automatizado (recomendado)
./scripts/migrate_all.sh

# Opción B: Manual por servicio
cd apps/auth-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
cd apps/operations-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
cd apps/tracking-service && npx prisma migrate dev --name init && npx prisma generate && cd ../..
```

El script `migrate_all.sh`:
- Itera sobre `auth-service`, `operations-service`, `tracking-service`
- Ejecuta `npx prisma migrate dev --name init` para cada uno
- Ejecuta `npx prisma generate` para cada uno
- Maneja errores y continúa con el siguiente servicio

### 4. Iniciar Servicios en Desarrollo

Abrir terminales separadas para cada servicio:

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

### 5. Smoke Tests (cURL)

Esperar ~10 segundos para que todos los servicios estén listos, luego:

#### 5.1 Auth Service - Signup

```bash
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 5.2 Auth Service - Signin

```bash
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 5.3 Operations Service - Crear Work Order

Primero, obtener un access token del signin anterior (guardarlo en variable):

```bash
# Guardar token
TOKEN=$(curl -s -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.accessToken')

# Crear work order
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

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "state": "pendiente",
    ...
  }
}
```

#### 5.4 Tracking Service - Ping

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

Respuesta esperada:
```json
{
  "_tag": "ok",
  "value": {
    "id": "...",
    "crewId": "crew-123",
    ...
  }
}
```

---

## Comandos Completos (Copy-Paste)

```bash
# 1. Iniciar infraestructura
docker compose -f infra/docker-compose.yml up -d postgres redis

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar migraciones
./scripts/migrate_all.sh

# 4. Iniciar servicios (en terminales separadas)
pnpm --filter @aaron/api-gateway dev
pnpm --filter @aaron/auth-service dev
pnpm --filter @aaron/operations-service dev
pnpm --filter @aaron/tracking-service dev

# 5. Smoke tests
# Ver sección anterior para comandos cURL
```

---

## Troubleshooting

### Error: "Failed to connect to database"

- Verificar que PostgreSQL está corriendo: `docker compose -f infra/docker-compose.yml ps`
- Verificar que `DATABASE_URL` apunta a `localhost:3307` (no `postgres:5432` en local)
- Verificar que el schema existe: `docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dn"`

### Error: "Schema does not exist"

Ejecutar manualmente la creación de schemas:

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "CREATE SCHEMA IF NOT EXISTS auth;"
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "CREATE SCHEMA IF NOT EXISTS operations;"
docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "CREATE SCHEMA IF NOT EXISTS tracking;"
```

### Error en migrate_all.sh: "Command not found"

Asegurarse de que el script es ejecutable:
```bash
chmod +x scripts/migrate_all.sh
```

### Migraciones ya aplicadas

Si ya existen migraciones y quieres reiniciar:

```bash
# ⚠️ CUIDADO: Esto borrará todas las migraciones
cd apps/auth-service && rm -rf prisma/migrations && cd ../..
cd apps/operations-service && rm -rf prisma/migrations && cd ../..
cd apps/tracking-service && rm -rf prisma/migrations && cd ../..

# Luego ejecutar migrate_all.sh nuevamente
./scripts/migrate_all.sh
```

---

## Verificación Final

Después de completar todos los pasos:

1. ✅ Todos los servicios deberían estar corriendo sin errores
2. ✅ Health checks deberían responder:
   ```bash
   curl http://localhost:3000/health  # Gateway
   curl http://localhost:3001/health    # Auth
   curl http://localhost:3002/health    # Operations
   curl http://localhost:3003/health    # Tracking
   ```
3. ✅ Las tablas deberían existir en la base de datos:
   ```bash
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt auth.*"
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt operations.*"
   docker compose -f infra/docker-compose.yml exec postgres psql -U app -d app -c "\dt tracking.*"
   ```

