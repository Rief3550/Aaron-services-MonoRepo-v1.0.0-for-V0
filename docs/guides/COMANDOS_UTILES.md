# Comandos Útiles

Colección de comandos útiles para desarrollo, mantenimiento y debugging del monorepo.

## 🚀 Desarrollo

### Iniciar todos los servicios

```bash
# Opción 1: Script (inicia todos en background)
pnpm dev

# Opción 2: Manualmente en 4 terminales
pnpm --filter @aaron/auth-service dev
pnpm --filter @aaron/operations-service dev
pnpm --filter @aaron/tracking-service dev
pnpm --filter @aaron/api-gateway dev

# Opción 3: Todos en paralelo (un comando)
bash scripts/dev.sh
```

### Iniciar un servicio específico

```bash
pnpm --filter @aaron/auth-service dev
pnpm --filter @aaron/operations-service dev
pnpm --filter @aaron/tracking-service dev
pnpm --filter @aaron/api-gateway dev
```

## 🗄️ Base de Datos

### Migraciones Prisma

```bash
# Ejecutar migraciones en todos los servicios
pnpm migrate:all

# O usar el script directamente
bash scripts/migrate_all.sh

# Migración de un servicio específico
cd apps/auth-service
npx prisma migrate dev --name nombre_migracion
npx prisma generate
cd ../..
```

### Generar Prisma Clients

```bash
# Todos los servicios
pnpm prisma:generate

# Un servicio específico
cd apps/auth-service && npx prisma generate && cd ../..
```

### Prisma Studio (Explorador Visual)

```bash
# Auth Service
cd apps/auth-service && npx prisma studio

# Operations Service
cd apps/operations-service && npx prisma studio

# Tracking Service
cd apps/tracking-service && npx prisma studio
```

## 🐳 Docker

### Levantar servicios de infraestructura

```bash
# PostgreSQL y Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# Todos los servicios (incluyendo microservicios)
docker compose -f infra/docker-compose.yml up -d

# Ver logs
docker compose -f infra/docker-compose.yml logs -f

# Ver logs de un servicio específico
docker compose -f infra/docker-compose.yml logs -f postgres
docker compose -f infra/docker-compose.yml logs -f redis
```

### Detener servicios

```bash
# Detener (sin eliminar contenedores)
docker compose -f infra/docker-compose.yml stop

# Detener y eliminar contenedores
docker compose -f infra/docker-compose.yml down

# Detener y eliminar contenedores + volúmenes (⚠️ borra datos)
docker compose -f infra/docker-compose.yml down -v
```

### Verificar estado

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker compose -f infra/docker-compose.yml logs -f
```

## 🔧 Scripts Útiles

### Inicialización completa

```bash
# Inicializar todo desde cero
pnpm init
```

### Variables de entorno

```bash
# Copiar .env.example a .env en todos los servicios
pnpm env:setup

# O manualmente
cd apps/auth-service && cp .env.example .env && cd ../..
```

### Schemas PostgreSQL

```bash
# Crear schemas (auth, operations, tracking)
pnpm schemas:create

# O manualmente
bash scripts/create_schemas.sh
```

## 🧪 Testing

### Ejecutar tests

```bash
# Todos los servicios
pnpm test

# Solo unit tests
pnpm test:unit

# Solo E2E tests
pnpm test:e2e

# Con coverage
pnpm test:coverage

# Un servicio específico
cd apps/auth-service && pnpm test && cd ../..
```

### Smoke E2E

```bash
# Ejecutar smoke test completo (requiere servicios corriendo)
pnpm smoke:e2e
```

## 🏗️ Build

### Compilar servicios

```bash
# Todos los servicios
pnpm build

# Un servicio específico
cd apps/auth-service && pnpm build && cd ../..
```

## 📝 Code Quality

### Linting

```bash
# Lint todos los archivos
pnpm lint

# Lint y auto-fix
pnpm lint:fix

# Un servicio específico
cd apps/auth-service && pnpm lint && cd ../..
```

### Formato

```bash
# Formatear todos los archivos
pnpm format

# Verificar formato (sin cambiar archivos)
pnpm format:check
```

### Type Checking

```bash
# Verificar tipos TypeScript
pnpm typecheck
```

## 🔍 Debugging

### Verificar conectividad

```bash
# PostgreSQL
psql -h localhost -p 3307 -U app -d app

# Redis
redis-cli -h localhost -p 6379 ping

# Health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Operations Service
curl http://localhost:3003/health  # Tracking Service
```

### Ver logs

```bash
# Docker logs
docker compose -f infra/docker-compose.yml logs -f postgres
docker compose -f infra/docker-compose.yml logs -f redis

# Logs de servicios en desarrollo
# Cada servicio imprime logs en su terminal
# O puedes usar el script dev.sh que guarda logs en ./logs/
```

### Verificar puertos

```bash
# Ver qué procesos están usando puertos
lsof -i :3000  # API Gateway
lsof -i :3001  # Auth Service
lsof -i :3002  # Operations Service
lsof -i :3003  # Tracking Service
lsof -i :3307  # PostgreSQL
lsof -i :6379  # Redis
```

## 🧹 Limpieza

### Limpiar node_modules

```bash
# Eliminar todos los node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Reinstalar
pnpm install
```

### Limpiar builds

```bash
# Eliminar todas las carpetas dist
find . -name "dist" -type d -prune -exec rm -rf '{}' +
```

### Limpiar Prisma

```bash
# Eliminar .prisma folders
find . -name ".prisma" -type d -prune -exec rm -rf '{}' +
```

## 📦 pnpm Workspace

### Listar paquetes

```bash
# Ver todos los workspaces
pnpm list -r --depth=0

# Ver dependencias de un workspace
pnpm list --filter @aaron/auth-service
```

### Agregar dependencia

```bash
# A un servicio específico
pnpm --filter @aaron/auth-service add express

# A todos los servicios
pnpm --filter "./apps/*" add some-package

# Como dev dependency
pnpm --filter @aaron/auth-service add -D @types/express
```

### Eliminar dependencia

```bash
# De un servicio específico
pnpm --filter @aaron/auth-service remove express
```

## 🔐 Seguridad

### Regenerar JWT secrets

```bash
# Generar un nuevo secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar en todos los .env
# apps/auth-service/.env
# apps/api-gateway/.env
# apps/tracking-service/.env
```

## 📚 Documentación

### Ver documentación

```bash
# Ver README principal
cat README.md

# Ver guía rápida
cat QUICKSTART.md

# Ver setup detallado
cat SETUP.md

# Ver configuración de variables de entorno
cat ENV_SETUP.md

# Ver estructura de módulos
cat MODULES.md

# Ver pipelines de calidad
cat QUALITY_PIPELINES.md
```

## 🚨 Troubleshooting

### Problema: Puerto en uso

```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### Problema: Error de conexión a DB

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Verificar conexión
psql -h localhost -p 3307 -U app -d app

# Ver logs de PostgreSQL
docker compose -f infra/docker-compose.yml logs postgres
```

### Problema: Prisma Client no generado

```bash
# Regenerar Prisma Client
cd apps/auth-service
npx prisma generate
cd ../..
```

### Problema: Error "Schema does not exist"

```bash
# Crear schemas
pnpm schemas:create
```

### Problema: Dependencias desactualizadas

```bash
# Actualizar pnpm
pnpm add -g pnpm@latest

# Limpiar e reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

