# Configuración de Variables de Entorno

Este documento describe cómo configurar las variables de entorno para cada servicio.

## Desarrollo Local (sin Docker)

### 1. Auth Service (`apps/auth-service/.env`)

```bash
PORT=3001
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=auth
JWT_ACCESS_SECRET=super_access_secret
JWT_REFRESH_SECRET=super_refresh_secret
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=30d
RESEND_API_KEY=re_live_xxx
MAIL_FROM="Hornero <noreply@hornero.app>"
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

### 2. Operations Service (`apps/operations-service/.env`)

```bash
PORT=3002
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=operations
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TRACKING_SERVICE_URL=http://localhost:3003
TRACKING_EVENT_CHANNEL=work_order_events
FRONTEND_URL=http://localhost:3000
```

### 3. Tracking Service (`apps/tracking-service/.env`)

```bash
PORT=3003
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=tracking
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super_access_secret
JWT_ACCESS_SECRET=super_access_secret
WS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=60000
TRACKING_EVENT_CHANNEL=work_order_events
FRONTEND_URL=http://localhost:3000
```

### 4. API Gateway (`apps/api-gateway/.env`)

```bash
PORT=3000
AUTH_URL=http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3001
OPERATIONS_SERVICE_URL=http://localhost:3002
OPS_URL=http://localhost:3002
TRACK_URL=ws://localhost:3003
TRACKING_SERVICE_URL=http://localhost:3003
JWT_ACCESS_SECRET=super_access_secret
JWT_PUBLIC_ROUTES=/auth/signup,/auth/signin,/auth/google,/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## Desarrollo con Docker

Cuando usas Docker Compose, las URLs de servicios cambian:

### Auth Service
```bash
DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=auth
```

### Operations Service
```bash
DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=operations
REDIS_URL=redis://redis:6379
TRACKING_SERVICE_URL=http://tracking-service:3003
```

### Tracking Service
```bash
DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=tracking
REDIS_URL=redis://redis:6379
```

### API Gateway
```bash
AUTH_URL=http://auth-service:3001
AUTH_SERVICE_URL=http://auth-service:3001
OPERATIONS_SERVICE_URL=http://operations-service:3002
OPS_URL=http://operations-service:3002
TRACK_URL=ws://tracking-service:3003
```

## Script de Setup Rápido

```bash
#!/bin/bash
# Copiar .env.example a .env en cada servicio

cd apps/auth-service && cp .env.example .env && cd ../..
cd apps/operations-service && cp .env.example .env && cd ../..
cd apps/tracking-service && cp .env.example .env && cd ../..
cd apps/api-gateway && cp .env.example .env && cd ../..

echo "✅ Archivos .env creados. Recuerda configurar las variables según tu entorno."
```

## Variables Importantes

### JWT Secrets
- **JWT_ACCESS_SECRET**: Debe ser el mismo en `auth-service`, `api-gateway` y `tracking-service`
- **JWT_REFRESH_SECRET**: Solo necesario en `auth-service`

### Database URLs
- **Local**: `postgresql://app:app@localhost:3307/app?schema=SCHEMA`
- **Docker**: `postgresql://app:app@postgres:5432/app?schema=SCHEMA`

### Redis URLs
- **Local**: `redis://localhost:6379`
- **Docker**: `redis://redis:6379`

### WebSocket Origins
- **WS_ALLOWED_ORIGINS**: URLs del frontend separadas por coma (sin espacios)
- Ejemplo: `http://localhost:5173,http://localhost:3000`

### Public Routes
- **JWT_PUBLIC_ROUTES**: Rutas sin autenticación, separadas por coma (sin espacios)
- Ejemplo: `/auth/signup,/auth/signin,/auth/google`

## Notas de Seguridad

⚠️ **Nunca commitees archivos `.env` al repositorio**

- Todos los servicios tienen `.env.example` como referencia
- Usa valores diferentes en producción
- Rotar secrets regularmente
- Usar secretos seguros (mínimo 32 caracteres aleatorios)

