# 🚀 Quick Start - Aaron Backend

## ⚡ Inicio Rápido con Docker (TODO en un comando)

```bash
./docker-start.sh
```

Este script levanta TODO automáticamente:
- ✅ Redis
- ✅ Auth Service
- ✅ Operations Service  
- ✅ Tracking Service
- ✅ API Gateway

Se conecta a tu PostgreSQL local automáticamente.

## 📊 Verificar que Todo Funcione

```bash
# Ver estado
docker compose ps

# Health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Operations
curl http://localhost:3003/health  # Tracking

# Ver logs
docker compose logs -f
```

## 🛑 Detener Todo

```bash
# Detener
docker compose stop

# Detener y eliminar
docker compose down
```

## 🔄 Reiniciar Después de Cambios

```bash
# Rebuild y restart un servicio
docker compose up -d --build auth-service

# O rebuild todo
docker compose up -d --build
```

## 📋 Servicios y Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| Auth Service | 3001 | http://localhost:3001 |
| Operations Service | 3002 | http://localhost:3002 |
| Tracking Service | 3003 | http://localhost:3003 |
| Redis | 6379 | localhost:6379 |
| PostgreSQL | 5432 | localhost:5432 (local) |

## 🎯 Estructura del Proyecto

```
Aaron-serv-Backend-Def/
├── Dockerfile.backend      ← Dockerfile unificado
├── docker-compose.yml      ← Levanta todo
├── docker-start.sh         ← Script de inicio
├── .dockerignore          
├── backend/
│   ├── services/          # Microservicios
│   └── shared/            # Librerías compartidas
├── frontend/web/          # Next.js 16
└── shared/types/          # Tipos compartidos
```

## 🔧 Comandos Útiles

```bash
# Ver logs de un servicio
docker compose logs -f auth-service

# Reiniciar un servicio
docker compose restart auth-service

# Ver recursos
docker stats

# Entrar a un contenedor
docker compose exec auth-service sh

# Ver todas las variables de entorno
docker compose exec auth-service env
```

## 🐛 Troubleshooting

### Build falla

```bash
# Build desde cero
docker compose build --no-cache

# Ver logs completos
docker compose build 2>&1 | tee build.log
```

### Puerto en uso

```bash
# Ver qué usa el puerto
lsof -i :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3100:3000"  # Cambia 3100 por el puerto que quieras
```

### No conecta a PostgreSQL

```bash
# Verificar PostgreSQL local
pg_isready

# Verificar que Docker puede llegar al host
docker compose exec auth-service ping host.docker.internal
```

## 📚 Documentación Completa

- `docs/DOCKER_COMPLETE_GUIDE.md` - Guía completa
- `docs/START_DEVELOPMENT.md` - Desarrollo local (sin Docker)
- `docs/CURRENT_CONFIG.md` - Configuración actual

---

**¡Listo!** Con `./docker-start.sh` levantas todo el sistema. 🚀

