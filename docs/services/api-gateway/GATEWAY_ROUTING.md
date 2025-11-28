# API Gateway - Routing y Configuración

Documentación completa del routing y configuración del API Gateway.

## Arquitectura

```
Frontend
    ↓
API Gateway (puerto 3000)
    ├─ /auth/* → auth-service (puerto 3001)
    ├─ /ops/* → operations-service (puerto 3002)
    └─ /health → Health check local
```

## Configuración Global

### 1. Validation Pipe

**Global Validation Pipe** configurado en `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Remueve propiedades no definidas en DTOs
    transform: true,              // Transforma payloads a instancias de DTO
    forbidNonWhitelisted: false,   // No rechaza, solo limpia
    transformOptions: {
      enableImplicitConversion: true, // Convierte tipos automáticamente
    },
  })
);
```

**Uso con DTOs:**
```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### 2. Rate Limiter

**Global Rate Limiter** usando `ThrottlerGuard`:

```typescript
// Configurado en app.module.ts
ThrottlerModule.forRoot([
  {
    ttl: 60,    // Ventana de tiempo: 60 segundos
    limit: 120, // Límite: 120 requests por ventana
  },
]);
```

**Características:**
- Aplica a todas las rutas del gateway
- Límite: **120 requests por minuto por IP**
- Respuesta cuando se excede:
  ```json
  {
    "statusCode": 429,
    "message": "ThrottlerException: Too Many Requests"
  }
  ```

### 3. Request ID Interceptor

**Global Interceptor** para trazabilidad:

- Agrega `x-request-id` a todos los requests
- Propagado a servicios downstream
- Útil para debugging y logging distribuido

## Proxy Routes

### /auth/* → AUTH_URL

**Configuración:**
- **Target**: `AUTH_URL` o `AUTH_SERVICE_URL` (fallback: `http://localhost:3001`)
- **Path Rewrite**: Remueve `/auth` del path
- **Ejemplo**: `GET /auth/users/me` → `GET http://auth-service:3001/users/me`

**Flujo:**
1. Request entra a `/auth/*`
2. `ProxyMiddleware` intercepta
3. `JwtAuthGuard` valida token (excepto rutas públicas)
4. Proxy enruta a `auth-service`
5. Response se retorna al cliente

**Headers propagados:**
- `x-request-id`: Para trazabilidad
- `x-user-id`: ID del usuario (desde JWT)
- `x-user-roles`: Roles del usuario (desde JWT)

### /ops/* → OPS_URL

**Configuración:**
- **Target**: `OPS_URL` o `OPERATIONS_SERVICE_URL` (fallback: `http://localhost:3002`)
- **Path Rewrite**: Remueve `/ops` del path
- **Ejemplo**: `GET /ops/work-orders` → `GET http://operations-service:3002/work-orders`

**Flujo:**
1. Request entra a `/ops/*`
2. `ProxyMiddleware` intercepta
3. `JwtAuthGuard` valida token (obligatorio, no hay rutas públicas)
4. Opcionalmente aplica policy hints (validación temprana de roles)
5. Proxy enruta a `operations-service`
6. Response se retorna al cliente

**Headers propagados:**
- `x-request-id`: Para trazabilidad
- `x-user-id`: ID del usuario
- `x-user-roles`: Roles del usuario

## Rutas Públicas

Rutas que **NO requieren autenticación JWT**:

**Configuración:**
```bash
JWT_PUBLIC_ROUTES=/auth/signup,/auth/signin,/auth/google,/auth/google/callback
```

**Ejemplos:**
- `POST /auth/signup` - Registro de usuarios
- `POST /auth/signin` - Login
- `GET /auth/google` - Iniciar OAuth Google
- `GET /auth/google/callback` - Callback de OAuth

## Policy Hints

Validación temprana de roles antes de enrutar al servicio downstream.

**Configuración:**
```bash
JWT_POLICY_HINTS=true
```

**Ejemplos:**
- `/ops/admin/*` → Requiere rol `ADMIN`
- `/ops/users/*` → Requiere rol `ADMIN`
- `/ops/work-orders/*/delete` → Requiere `ADMIN` o `OPERATOR`

Si el usuario no tiene los roles requeridos, el gateway responde `403 Forbidden` **sin enrutar** al servicio.

## WebSocket

**IMPORTANTE**: El gateway **NO** hace proxy de WebSocket.

### Conexión Directa

El frontend debe conectarse directamente al `tracking-service`:

```
ws://tracking-service:3003/ws/track?token=JWT_TOKEN
```

**Razones:**
1. WebSocket requiere conexión persistente
2. El tracking-service tiene su propia configuración de CORS/allowed origins
3. Simplifica la arquitectura (menos hops)
4. Mejor performance para streaming de ubicación

**Configuración en tracking-service:**
```bash
WS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Endpoints Locales

### GET /health

Health check del gateway (no requiere autenticación):

```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Variables de Entorno

```bash
# Puerto del gateway
PORT=3000

# URLs de servicios backend
AUTH_URL=http://auth-service:3001
OPS_URL=http://operations-service:3002

# JWT
JWT_ACCESS_SECRET=super_access_secret
JWT_PUBLIC_ROUTES=/auth/signup,/auth/signin,/auth/google,/auth/google/callback
JWT_POLICY_HINTS=true

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
NODE_ENV=development
```

## Flujo Completo de Request

```
1. Cliente → GET /ops/work-orders
   ↓
2. API Gateway recibe request
   ↓
3. RequestIdInterceptor agrega x-request-id
   ↓
4. ThrottlerGuard verifica rate limit (120 req/min)
   ↓
5. ProxyMiddleware intercepta /ops/*
   ↓
6. JwtAuthGuard valida token (Bearer ...)
   ↓
7. Policy Hints (opcional): Verifica roles
   ↓
8. createProxyMiddleware enruta a operations-service
   ↓
9. operations-service procesa request
   ↓
10. Response se retorna al cliente a través del gateway
```

## Manejo de Errores

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Missing Bearer token"
  }
}
```

### 403 Forbidden (Policy Hint)
```json
{
  "success": false,
  "error": {
    "message": "Access denied by policy hint"
  }
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### 502 Bad Gateway
```json
{
  "success": false,
  "error": {
    "message": "Bad Gateway: Failed to proxy request to operations-service"
  }
}
```

## Debugging

### Ver x-request-id en logs

Todas las requests tienen `x-request-id`. Úsalo para rastrear requests a través de los servicios:

```bash
curl -H "Authorization: Bearer TOKEN" \
     -H "x-request-id: custom-id-123" \
     http://localhost:3000/ops/work-orders
```

### Logs del Gateway

```typescript
// Habilitar logs detallados
LOG_LEVEL=debug
```

## Mejores Prácticas

1. **Usar HTTPS en producción**: El gateway debe usar HTTPS
2. **Configurar CORS adecuadamente**: Solo permitir orígenes confiables
3. **Rate limiting por endpoint**: Considerar límites más estrictos para endpoints críticos
4. **Health checks**: Monitorear `/health` para verificar disponibilidad
5. **Timeouts**: Configurar timeouts adecuados para proxies
6. **Logging**: Usar `x-request-id` para correlacionar logs entre servicios

