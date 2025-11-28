# 🔧 Configuración Actual del Sistema

## ✅ Servicios Activos

### PostgreSQL 18.0 (Local - Homebrew)
- **Estado**: ✅ Corriendo
- **Puerto**: 5432
- **URL**: `postgresql://postgres:postgres@localhost:5432/postgres`
- **Verificar**: `pg_isready -h localhost -p 5432`
- **Conectar**: `psql -h localhost -U postgres`

### Redis 7 (Docker)
- **Estado**: ✅ Corriendo
- **Puerto**: 6379
- **URL**: `redis://localhost:6379`
- **Container**: `redis_local`
- **Verificar**: `docker compose -f infra/docker-compose.yml ps redis`

## 📝 Variables de Entorno (.env)

```bash
# PostgreSQL Local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Redis Docker
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379

# Servicios
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
OPERATIONS_SERVICE_PORT=3002
TRACKING_SERVICE_PORT=3003
```

## 🎯 Arquitectura Actual

```
┌─────────────────────────────────────────┐
│         TU MÁQUINA LOCAL                │
│                                         │
│  ┌─────────────┐     ┌──────────────┐  │
│  │ PostgreSQL  │     │    Redis     │  │
│  │   (Local)   │     │   (Docker)   │  │
│  │  Puerto 5432│     │  Puerto 6379 │  │
│  └─────────────┘     └──────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Servicios Node.js (pnpm dev)  │   │
│  │                                 │   │
│  │  • API Gateway (3000)           │   │
│  │  • Auth Service (3001)          │   │
│  │  • Operations Service (3002)    │   │
│  │  • Tracking Service (3003)      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Frontend (Next.js 16)         │   │
│  │   frontend/web/                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 🚀 Comandos de Inicio

### Inicio Rápido

```bash
# PostgreSQL ya está corriendo (servicio local)
# Redis en Docker ya está corriendo

# Iniciar todos los servicios
pnpm dev
```

### Verificación

```bash
# PostgreSQL
pg_isready

# Redis
docker compose -f infra/docker-compose.yml ps redis

# Servicios (después de pnpm dev)
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## 🔧 Gestión de Servicios

### PostgreSQL Local

```bash
# Ver status (Homebrew)
brew services list | grep postgresql

# Reiniciar
brew services restart postgresql@18

# Ver logs
tail -f /opt/homebrew/var/log/postgresql@18.log

# Conectar
psql -h localhost -U postgres
```

### Redis Docker

```bash
# Ver status
docker compose -f infra/docker-compose.yml ps

# Ver logs
docker compose -f infra/docker-compose.yml logs -f redis

# Reiniciar
docker compose -f infra/docker-compose.yml restart redis

# Detener
docker compose -f infra/docker-compose.yml stop redis

# Iniciar
docker compose -f infra/docker-compose.yml up -d redis
```

## 📊 Puertos en Uso

| Servicio | Puerto | Tipo |
|----------|--------|------|
| PostgreSQL | 5432 | Local |
| Redis | 6379 | Docker |
| API Gateway | 3000 | Node.js |
| Auth Service | 3001 | Node.js |
| Operations Service | 3002 | Node.js |
| Tracking Service | 3003 | Node.js |
| WebSocket | 3004 | Node.js |

## 💡 Workflow Diario

### Mañana

```bash
# 1. Verificar que PostgreSQL local esté corriendo
pg_isready

# 2. Verificar/iniciar Redis si es necesario
docker compose -f infra/docker-compose.yml ps redis
# Si no está corriendo:
docker compose -f infra/docker-compose.yml up -d redis

# 3. Iniciar desarrollo
pnpm dev
```

### Durante el Día

```bash
# Ver logs de servicios
# (Ctrl+C para detener, pnpm dev para reiniciar)

# Conectar a PostgreSQL si necesitas
psql -h localhost -U postgres

# Ver datos en Redis
docker compose -f infra/docker-compose.yml exec redis redis-cli
```

### Tarde/Noche

```bash
# Detener servicios Node.js
# (Ctrl+C en la terminal donde corre pnpm dev)

# Opcional: Detener Redis Docker
docker compose -f infra/docker-compose.yml stop redis

# PostgreSQL local puede seguir corriendo (no afecta)
```

## 🎯 Ventajas de Esta Configuración

✅ **Performance**
- PostgreSQL local es más rápido que Docker
- Sin overhead de virtualización

✅ **Herramientas**
- Usa pgAdmin, DBeaver, TablePlus directamente
- CLI tools funcionan nativamente

✅ **Familiar**
- Si ya usabas PostgreSQL local, todo igual
- Mismos comandos, misma configuración

✅ **Híbrido**
- PostgreSQL local para desarrollo rápido
- Redis en Docker para aislamiento
- Servicios Node.js en local para hot reload

## ⚠️ Notas Importantes

### Backups
Tu PostgreSQL local debería tener backups. Para crear uno:

```bash
# Backup completo
pg_dump -h localhost -U postgres postgres > backup.sql

# Backup por servicio
pg_dump -h localhost -U postgres -n auth > auth_backup.sql
pg_dump -h localhost -U postgres -n operations > operations_backup.sql
```

### Bases de Datos Separadas (Opcional)

Si prefieres DBs separadas en lugar de schemas:

```bash
# Crear bases de datos
psql -h localhost -U postgres << EOF
CREATE DATABASE auth_db;
CREATE DATABASE operations_db;
CREATE DATABASE tracking_db;
EOF

# Actualizar .env por servicio
# backend/services/auth-service/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_db"
```

---

**Configuración optimizada para desarrollo.** PostgreSQL local + Redis Docker = mejor de ambos mundos.

