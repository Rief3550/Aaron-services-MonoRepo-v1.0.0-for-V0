# API Clients - Guía de Uso

Este directorio contiene los clientes HTTP configurados para cada microservicio.

## Clientes Disponibles

### `authApi` - Auth Service
Cliente para autenticación y gestión de usuarios.

**Base URL:** `http://localhost:3000/auth` (configurable via `NEXT_PUBLIC_AUTH_URL`)

**Endpoints comunes:**
```typescript
import { authApi } from '@/lib/api/services';

// Sign in
const result = await authApi.post('/signin', { email, password });

// Sign up
const result = await authApi.post('/signup', { email, password, fullName });

// Sign out
await authApi.post('/signout');

// Refresh token
const result = await authApi.post('/refresh', { refreshToken });

// Get current user (usar authService.getCurrentUser() en su lugar)
// /users/me está bajo el gateway directamente
```

### `opsApi` - Operations Service
Cliente para operaciones, órdenes de trabajo, solicitudes, etc.

**Base URL:** `http://localhost:3000/ops` (configurable via `NEXT_PUBLIC_OPS_URL`)

**Ejemplo de uso:**
```typescript
import { opsApi } from '@/lib/api/services';

// Listar órdenes de trabajo
const result = await opsApi.get('/work-orders');

// Obtener una orden específica
const result = await opsApi.get(`/work-orders/${orderId}`);

// Crear orden de trabajo
const result = await opsApi.post('/work-orders', {
  title: 'Reparación',
  description: '...',
  // ...
});

// Actualizar estado
const result = await opsApi.patch(`/work-orders/${orderId}/status`, {
  status: 'IN_PROGRESS'
});
```

### `trackingApi` - Tracking Service
Cliente para seguimiento y rastreo (si tiene endpoints HTTP).

**Base URL:** `http://localhost:3000/track` (configurable via `NEXT_PUBLIC_TRACKING_URL`)

**Nota:** El tracking service principalmente usa WebSockets (`NEXT_PUBLIC_WS_URL`). Solo usa este cliente si el servicio expone endpoints HTTP REST.

**Ejemplo de uso (si aplica):**
```typescript
import { trackingApi } from '@/lib/api/services';

// Si hay endpoints HTTP
const result = await trackingApi.get('/events');
const result = await trackingApi.post('/track', { location, timestamp });
```

## Gestión de Tokens

Todos los clientes automáticamente agregan el token JWT del `localStorage` a las peticiones si está disponible. No necesitas agregar el header `Authorization` manualmente.

## Respuestas

Todos los clientes retornan `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

**Ejemplo:**
```typescript
try {
  const response = await opsApi.get('/work-orders');
  if (response.success && response.data) {
    const orders = response.data; // Array de órdenes
  }
} catch (error) {
  console.error('Error:', error.message);
}
```

## Configuración de URLs

Las URLs base se configuran en `next.config.ts` y pueden ser sobrescritas con variables de entorno:

```bash
# .env.local
NEXT_PUBLIC_AUTH_URL=http://localhost:3000/auth
NEXT_PUBLIC_OPS_URL=http://localhost:3000/ops
NEXT_PUBLIC_TRACKING_URL=http://localhost:3000/track
```

**Nota:** En producción, estas URLs pueden apuntar directamente a los microservicios si no usas un gateway.


