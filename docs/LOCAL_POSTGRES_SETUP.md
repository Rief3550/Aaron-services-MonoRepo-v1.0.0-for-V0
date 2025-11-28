# 🐘 Usando PostgreSQL Local

## ✅ Configuración Actual

**Estás usando PostgreSQL local** en lugar de Docker. Esta es una excelente opción para desarrollo.

### Estado de Servicios

- ✅ **PostgreSQL**: Local (puerto 5432)
- ✅ **Redis**: Docker (puerto 6379)
- ❌ **PostgreSQL Docker**: Detenido

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# PostgreSQL local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Redis en Docker
REDIS_URL="redis://localhost:6379"
```

## 📊 Verificar PostgreSQL Local

### 1. Verificar que esté corriendo

```bash
# Verificar estado
pg_isready -h localhost -p 5432

# Conectarse
psql -h localhost -U postgres -d postgres
```

### 2. Crear base de datos (si es necesario)

```bash
# Conectarse a PostgreSQL
psql -h localhost -U postgres

# Crear base de datos para cada servicio
CREATE DATABASE auth_db;
CREATE DATABASE operations_db;
CREATE DATABASE tracking_db;

# Salir
\q
```

### 3. Configurar URLs por servicio (opcional)

Si quieres bases de datos separadas para cada servicio:

```bash
# En .env o en cada servicio
# Auth Service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_db"

# Operations Service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/operations_db"

# Tracking Service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracking_db"
```

## 🚀 Correr Migraciones

```bash
# Auth Service
cd backend/services/auth-service
pnpm prisma:migrate:dev

# Operations Service
cd ../operations-service
pnpm prisma:migrate:dev

# Tracking Service
cd ../tracking-service
pnpm prisma:migrate:dev
```

## 🎯 Workflow de Desarrollo

### Inicio del Día

```bash
# 1. Verificar PostgreSQL local (ya debería estar corriendo)
pg_isready

# 2. Iniciar solo Redis en Docker
docker compose -f infra/docker-compose.yml up -d redis

# 3. Iniciar desarrollo
pnpm dev
```

### Durante el Desarrollo

```bash
# Ver datos en PostgreSQL
psql -h localhost -U postgres -d postgres

# Queries útiles
\l              # Listar bases de datos
\c auth_db      # Conectarse a una base de datos
\dt             # Listar tablas
\d users        # Ver estructura de una tabla
```

## 🔄 Volver a Docker (si quieres)

Si en algún momento quieres volver a usar PostgreSQL de Docker:

```bash
# 1. Actualizar .env
DATABASE_URL="postgresql://postgres:postgres@localhost:3307/postgres"

# 2. Iniciar PostgreSQL en Docker
docker compose -f infra/docker-compose.yml up -d postgres

# 3. Verificar
docker compose -f infra/docker-compose.yml ps
```

## 💡 Ventajas de PostgreSQL Local

✅ **Más rápido**: Sin overhead de Docker
✅ **Familiar**: Usas tus herramientas habituales
✅ **Persistente**: Datos persisten entre reinicios del sistema
✅ **Herramientas**: pgAdmin, DBeaver, etc. funcionan directamente

## ⚠️ Consideraciones

### Puerto
- PostgreSQL local usa puerto **5432**
- PostgreSQL Docker usaba puerto **3307**
- Asegúrate de que `.env` tenga el puerto correcto

### Usuario y Contraseña
- Por defecto: `postgres / postgres`
- Si usas otros, actualiza el `DATABASE_URL`

### Schemas
- Los servicios usan diferentes schemas en la misma DB
- O puedes usar bases de datos separadas (recomendado)

## 🧪 Testing de Conexión

```bash
# Probar conexión directa
psql -h localhost -p 5432 -U postgres -c "SELECT version();"

# Probar desde Node.js (en cualquier servicio)
cd backend/services/auth-service
pnpm prisma db pull
```

## 📚 Comandos Útiles de PostgreSQL

```bash
# Ver procesos de PostgreSQL
ps aux | grep postgres

# Ver conexiones activas
psql -h localhost -U postgres -c "SELECT * FROM pg_stat_activity;"

# Reiniciar PostgreSQL (macOS con Homebrew)
brew services restart postgresql@16
# o
brew services restart postgresql

# Ver logs de PostgreSQL (macOS)
tail -f /opt/homebrew/var/log/postgresql@16.log
```

---

**Configuración completa.** PostgreSQL local está listo para usar. Solo Redis corre en Docker.

