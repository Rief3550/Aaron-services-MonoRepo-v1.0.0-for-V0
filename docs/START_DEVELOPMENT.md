# 🚀 Iniciar Desarrollo - Guía Rápida

## ✅ Todo Listo Para Empezar

Tu configuración está completa y optimizada para desarrollo:

- ✅ **PostgreSQL Local**: Corriendo en puerto 5432
- ✅ **Redis Docker**: Corriendo en puerto 6379  
- ✅ **Monorepo**: Configurado con Turbo Repo
- ✅ **Variables**: `.env` configurado
- ✅ **Código**: Compila correctamente

## 🎯 Iniciar TODO (Un Solo Comando)

```bash
pnpm dev
```

Este comando inicia:
1. API Gateway (puerto 3000)
2. Auth Service (puerto 3001)
3. Operations Service (puerto 3002)
4. Tracking Service (puerto 3003)

## 📊 Verificar que Todo Funcione

En otra terminal, ejecuta:

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## 🔧 Servicios de Infraestructura

### PostgreSQL (Ya corriendo)

```bash
# Verificar estado
pg_isready

# Conectarse
psql -h localhost -U root -d postgres

# Ver bases de datos
\l

# Ver tablas
\dt
```

### Redis (Docker)

```bash
# Ver estado
docker compose -f infra/docker-compose.yml ps redis

# Conectarse
docker compose -f infra/docker-compose.yml exec redis redis-cli

# Test
PING
> PONG
```

## 📁 Estructura de Desarrollo

```
Aaron-serv-Backend-Def/
├── backend/
│   ├── services/          # Microservicios
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── operations-service/
│   │   └── tracking-service/
│   └── shared/            # Librerías compartidas
│       ├── common/
│       ├── auth/
│       ├── mail/
│       └── prisma/
├── frontend/
│   └── web/              # Next.js 16
└── shared/
    └── types/            # Tipos compartidos
```

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Iniciar todo
pnpm dev

# Iniciar solo backend
pnpm dev:backend

# Iniciar solo frontend
pnpm dev:frontend

# Build everything
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Base de Datos (Prisma)

```bash
# Crear/aplicar migraciones
cd backend/services/auth-service
pnpm prisma:migrate:dev

# Ver base de datos (Prisma Studio)
pnpm prisma:studio

# Generar Prisma Client
pnpm prisma:generate
```

### Turbo Cache

```bash
# Ver caché
pnpm turbo run build --dry-run

# Limpiar caché
rm -rf .turbo

# Configurar remote cache (opcional)
pnpm turbo link
```

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Ver qué usa el puerto
lsof -i :3000
lsof -i :3001

# Matar proceso
kill -9 <PID>
```

### PostgreSQL no conecta

```bash
# Verificar que esté corriendo
pg_isready

# Verificar credenciales en .env
cat .env | grep DATABASE_URL

# Iniciar PostgreSQL (si está detenido)
brew services start postgresql@18
```

### Redis no conecta

```bash
# Verificar estado
docker compose -f infra/docker-compose.yml ps redis

# Iniciar si no está corriendo
docker compose -f infra/docker-compose.yml up -d redis

# Ver logs
docker compose -f infra/docker-compose.yml logs redis
```

### Errores de tipos/imports

```bash
# Reinstalar dependencias
pnpm install

# Regenerar Prisma Client
cd backend/services/auth-service
pnpm prisma:generate

# Rebuild librerías compartidas
pnpm turbo run build --filter="@aaron/common" --filter="@aaron/auth"
```

## 🎯 Workflow Típico

### Al Comenzar el Día

```bash
# 1. Verificar infraestructura
pg_isready  # PostgreSQL
docker compose -f infra/docker-compose.yml ps  # Redis

# 2. Iniciar desarrollo
pnpm dev

# 3. Verificar que todo funcione
curl http://localhost:3000/health
```

### Durante Desarrollo

- Hot reload automático (Nest.js watch mode)
- Turbo cache acelera rebuilds
- Prisma Studio para ver/editar datos: `pnpm prisma:studio`

### Antes de Commit

```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Tests (si tienes)
pnpm test

# Build (verificar que compile)
pnpm build
```

## 📚 Endpoints Disponibles

### API Gateway (3000)
- `GET /health` - Health check
- Auth, Operations, y Tracking se proxean aquí

### Auth Service (3001)
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Perfil (requiere auth)

### Operations Service (3002)
- `GET /subscriptions` - Lista de planes
- `POST /subscriptions/create` - Crear subscripción
- `POST /payments/webhook` - Webhook de Stripe

### Tracking Service (3003)
- `POST /work-orders` - Crear orden
- `GET /work-orders` - Listar órdenes
- `GET /work-orders/:id` - Detalle de orden
- `PATCH /work-orders/:id/status` - Actualizar estado

## 🎉 ¡Todo Listo!

Ejecuta `pnpm dev` y empieza a desarrollar.

**Documentación adicional:**
- `docs/CURRENT_CONFIG.md` - Configuración actual
- `docs/LOCAL_POSTGRES_SETUP.md` - PostgreSQL local
- `docs/DOCKER_QUICK_START.md` - Docker (si lo necesitas)

---

**Estado**: ✅ Listo para desarrollo | 🚀 `pnpm dev` y empieza a programar

