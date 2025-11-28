# Resumen de Configuración - Aaron Backend

## Base de Datos

### ✅ Estructura Actual
- **Base de datos:** `postgres`
- **Schemas:** `auth`, `operations`, `tracking`
- **Total tablas:** 22 tablas
  - auth: 5 tablas
  - operations: 14 tablas
  - tracking: 3 tablas

### ✅ Conexión en Desarrollo
```
Docker Container → host.docker.internal:5432 → PostgreSQL Local
```

### ✅ Conexión en Producción
```
Docker Container → host.docker.internal:5432 → PostgreSQL VPS (externo)
```

## Docker

### Development (`docker-compose.yml`)
- ✅ App Container (puerto 3100)
- ✅ Redis Container
- ❌ NO PostgreSQL Container

### Production (`docker-compose.prod.yml`)
- ✅ App Container (puerto 80)
- ✅ Redis Container
- ❌ NO PostgreSQL Container

## Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| [`docker-compose.yml`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/docker-compose.yml) | Configuración Docker para desarrollo |
| [`docker-compose.prod.yml`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/docker-compose.prod.yml) | Configuración Docker para producción |
| [`.env.development`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/.env.development) | Variables de entorno para desarrollo |
| [`.env.production`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/.env.production) | Variables de entorno para producción |
| [`VPS-POSTGRESQL-SETUP.md`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/VPS-POSTGRESQL-SETUP.md) | Guía de configuración de PostgreSQL en VPS |
| [`run-migrations.sh`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/run-migrations.sh) | Script para ejecutar migraciones de Prisma |
| [`create-all-tables.sql`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/create-all-tables.sql) | Script SQL para crear todas las tablas |

## Scripts SQL Útiles

| Script | Propósito |
|--------|-----------|
| [`init-schemas.sql`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/init-schemas.sql) | Crear schemas y usuario root |
| [`create-all-tables.sql`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/create-all-tables.sql) | Crear todas las tablas |
| [`cleanup-and-verify-db.sql`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/cleanup-and-verify-db.sql) | Verificar estructura de DB |
| [`verify-prisma-schemas.sql`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/verify-prisma-schemas.sql) | Verificar schemas de Prisma |

## Comandos Rápidos

### Desarrollo Local
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Ejecutar migraciones
./run-migrations.sh

# Detener servicios
docker-compose down
```

### Producción (VPS)
```bash
# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f app

# Ejecutar migraciones
./run-migrations.sh

# Detener servicios
docker-compose -f docker-compose.prod.yml down
```

### PostgreSQL
```bash
# Conectar a la base de datos
psql -U root -d postgres

# Verificar schemas
psql -U root -d postgres -c "\dn"

# Verificar tablas
psql -U root -d postgres -c "SELECT table_schema, COUNT(*) FROM information_schema.tables WHERE table_schema IN ('auth', 'operations', 'tracking') GROUP BY table_schema;"
```

## Próximos Pasos para Producción

1. ✅ Configuración de Docker completada
2. ⏳ Instalar PostgreSQL en VPS (ver [`VPS-POSTGRESQL-SETUP.md`](file:///Users/edelar/Documents/GitHub/Aaron-serv-Backend-Def/VPS-POSTGRESQL-SETUP.md))
3. ⏳ Configurar credenciales en `.env.production`
4. ⏳ Ejecutar migraciones en VPS
5. ⏳ Desplegar aplicación
