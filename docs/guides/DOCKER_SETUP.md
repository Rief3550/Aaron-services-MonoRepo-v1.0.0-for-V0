# Docker Setup & Compose

Guía para construir y ejecutar servicios en Docker.

## Estructura

Todos los servicios tienen Dockerfiles multi-stage optimizados para producción:
- **deps stage**: Instala dependencias con pnpm
- **build stage**: Compila TypeScript con NestJS CLI
- **runner stage**: Solo código compilado y node_modules de producción

## Docker Compose

El archivo `infra/docker-compose.yml` define:

- **postgres**: PostgreSQL en puerto 3307
- **redis**: Redis en puerto 6379
- **api-gateway**: Puerto 3000
- **auth-service**: Puerto 3001
- **operations-service**: Puerto 3002
- **tracking-service**: Puerto 3003

### Variables de Entorno

Los servicios usan archivos `.env` en cada `apps/*/.env`:

```bash
apps/api-gateway/.env
apps/auth-service/.env
apps/operations-service/.env
apps/tracking-service/.env
```

**Importante**: Actualiza las URLs para Docker:
- `DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=...` (no `localhost:3307`)
- `REDIS_URL=redis://redis:6379` (no `localhost:6379`)
- Service URLs: `http://auth-service:3001` (no `localhost:3001`)

## Comandos

### Con Makefile

```bash
# Construir todas las imágenes
make build

# Iniciar todos los servicios
make up

# Ver logs de un servicio
make logs SERVICE=api-gateway
make logs SERVICE=auth-service

# Ver servicios corriendo
make ps

# Reiniciar un servicio
make restart SERVICE=auth-service

# Detener todos los servicios
make down

# Limpiar todo (incluyendo volúmenes)
make clean

# Solo infraestructura
make infra-up
make infra-down
```

### Con Docker Compose Directo

```bash
# Construir imágenes
docker compose -f infra/docker-compose.yml build

# Iniciar servicios (detached)
docker compose -f infra/docker-compose.yml up -d

# Ver logs de un servicio
docker compose -f infra/docker-compose.yml logs -f api-gateway
docker compose -f infra/docker-compose.yml logs -f auth-service
docker compose -f infra/docker-compose.yml logs -f operations-service
docker compose -f infra/docker-compose.yml logs -f tracking-service

# Ver estado de servicios
docker compose -f infra/docker-compose.yml ps

# Detener servicios
docker compose -f infra/docker-compose.yml down

# Reiniciar un servicio
docker compose -f infra/docker-compose.yml restart auth-service
```

### Solo Infraestructura

```bash
# Iniciar solo postgres y redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# Ver logs de postgres
docker compose -f infra/docker-compose.yml logs -f postgres

# Ver logs de redis
docker compose -f infra/docker-compose.yml logs -f redis
```

## Desarrollo Local vs Docker

### Desarrollo Local (recomendado)

1. Iniciar solo infraestructura:
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```

2. Ejecutar servicios localmente:
   ```bash
   pnpm --filter @aaron/api-gateway dev
   pnpm --filter @aaron/auth-service dev
   pnpm --filter @aaron/operations-service dev
   pnpm --filter @aaron/tracking-service dev
   ```

3. Usar `.env` con `localhost:3307` y `localhost:6379`

### Docker (todo en containers)

1. Actualizar `.env` para usar nombres de servicio:
   ```bash
   DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=auth
   REDIS_URL=redis://redis:6379
   AUTH_URL=http://auth-service:3001
   OPS_URL=http://operations-service:3002
   ```

2. Construir y levantar:
   ```bash
   docker compose -f infra/docker-compose.yml build
   docker compose -f infra/docker-compose.yml up -d
   ```

## Troubleshooting

### Error: "Cannot connect to database"

Verifica que el servicio esté usando el nombre correcto del servicio:
- Docker: `postgres:5432` (nombre del servicio)
- Local: `localhost:3307` (puerto mapeado)

### Error: "Port already in use"

```bash
# Verificar qué usa el puerto
lsof -i :3000
lsof -i :3001

# Detener servicios Docker
docker compose -f infra/docker-compose.yml down
```

### Reconstruir imagen de un servicio

```bash
docker compose -f infra/docker-compose.yml build --no-cache auth-service
docker compose -f infra/docker-compose.yml up -d auth-service
```

### Ver logs de todos los servicios

```bash
docker compose -f infra/docker-compose.yml logs -f
```

### Limpiar todo y empezar de nuevo

```bash
# Detener y remover todo
docker compose -f infra/docker-compose.yml down -v

# Limpiar imágenes no usadas
docker system prune -a

# Reconstruir desde cero
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d
```

