# API Gateway

Gateway principal que enruta requests a los microservicios con autenticación JWT, rate limiting y trazabilidad.

## Funcionalidades

- ✅ **Proxy HTTP**: Enrutamiento a auth-service y operations-service
- ✅ **JWT Guard Global**: Validación de tokens antes de enrutar
- ✅ **Rate Limiting**: ThrottlerGuard global (120 req/min por IP)
- ✅ **x-request-id**: Interceptor para trazabilidad de requests
- ✅ **Rutas Públicas**: Configurables por variable de entorno
- ✅ **Health Checks**: Liveness y readiness endpoints

## Rutas

### Proxy

- `/auth/*` → `AUTH_URL` (auth-service, puerto 3001)
- `/ops/*` → `OPS_URL` (operations-service, puerto 3002)

### Endpoints Locales

- `GET /health` - Liveness check
- `GET /health/readiness` - Readiness check

## WebSocket Tracking

**IMPORTANTE**: El gateway NO hace proxy de WebSocket.

Para conectar al tracking-service WebSocket, el frontend debe conectarse directamente a:
```
ws://tracking-service:3003/ws/track?token=JWT_TOKEN
```

O desde el frontend:
```
ws://localhost:3003/ws/track?token=JWT_TOKEN
```

El tracking-service tiene su propia configuración de CORS/allowed origins.

## Seguridad

### JWT Validation

El gateway valida el Access Token antes de enrutar:
1. Extrae token del header `Authorization: Bearer <token>`
2. Verifica firma y expiración
3. Extrae `sub`/`userId` y `roles` del payload
4. Asigna usuario al request para servicios downstream
5. Agrega headers `x-user-id` y `x-user-roles` al request proxy

### Rutas Públicas

Configurables en `JWT_PUBLIC_ROUTES`:
```bash
JWT_PUBLIC_ROUTES=/auth/signup,/auth/signin,/auth/google,/auth/google/callback,/health
```

## Configuración

Ver `.env.example` para todas las variables requeridas.

- `PORT` - Puerto del gateway (default: 3000)
- `AUTH_URL` - URL del auth-service
- `OPS_URL` - URL del operations-service
- `TRACK_URL` - URL del tracking-service (solo documentación, no se usa para proxy)
- `JWT_ACCESS_SECRET` - Secreto JWT (debe coincidir con auth-service)
- `JWT_PUBLIC_ROUTES` - Rutas públicas separadas por coma
- `JWT_POLICY_HINTS` - Habilitar policy hints (`true`/`false`, default: `false`)
- `CORS_ORIGINS` - Orígenes permitidos para CORS

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo (con watch)
pnpm dev

# Build
pnpm build

# Producción
pnpm start
```

## Rate Limiting

Configurado globalmente con ThrottlerModule:
- **Ventana**: 60 segundos
- **Límite**: 120 requests por IP

## Request ID

Todos los requests incluyen `x-request-id` en headers:
- Si el cliente envía `x-request-id`, se propaga
- Si no, se genera un UUID nuevo
- Se propaga a todos los microservicios vía proxy

## Arquitectura

```
Frontend
   ↓
API Gateway (JWT validation, rate limiting, routing)
   ↓
   ├─→ auth-service (/auth/*)
   ├─→ operations-service (/ops/*)
   └─→ tracking-service (WebSocket directo, no proxy)
```
