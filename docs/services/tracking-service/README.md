# Tracking Service

Servicio de seguimiento y ubicación en tiempo real para cuadrillas.

## Funcionalidades

- ✅ **WebSocket en tiempo real**: Conexión directa para tracking de ubicación
- ✅ **Redis Pub/Sub**: Escucha eventos de operations-service cuando orden pasa a "en_camino"
- ✅ **Salas WebSocket**: Rooms `order:{id}` y `crew:{id}` para broadcast
- ✅ **Persistencia**: Guarda pings de ubicación (realtime y hourly)
- ✅ **API HTTP**: Endpoint para ping cada 1h cuando orden está "en_trabajo"
- ✅ **Consultas de rutas**: Historial de ubicaciones con cálculo de distancia

## Flujo de Integración

### 1. Orden pasa a "en_camino"

**Operations Service:**
```typescript
PATCH /ops/work-orders/:id/state
{ "state": "en_camino" }
```

Publica evento en Redis:
```json
{
  "orderId": "uuid",
  "crewId": "uuid",
  "targetLocation": {
    "address": "Calle 123",
    "lat": -34.603722,
    "lng": -58.381592
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Tracking Service:**
1. Recibe evento vía Redis Pub/Sub
2. Broadcast evento `order_en_camino` a room `order:{orderId}`
3. Si hay crewId, también broadcast a `crew:{crewId}`
4. Emite ubicación target si existe

### 2. App Móvil se conecta

**Conexión WebSocket:**
```
ws://tracking-service:3003/ws/track?token=JWT_TOKEN
```

**Autenticación:**
- Token JWT en query string
- Token debe contener `userId` o `sub`

**Suscripción:**
```json
{
  "type": "subscribe",
  "room": "order:abc123"
}
```

### 3. Envío de ubicación (orden en_camino)

**App móvil envía cada 5-10s:**
```json
{
  "type": "location_update",
  "crewId": "uuid",
  "orderId": "uuid",
  "lat": -34.603722,
  "lng": -58.381592
}
```

**Tracking Service:**
1. Valida coordenadas
2. Guarda en DB (source: `realtime`)
3. Broadcast a `crew:{crewId}` y `order:{orderId}`
4. Confirma recepción

### 4. Ping cuando orden "en_trabajo"

**App móvil cambia a API HTTP cada 1 hora:**
```
POST /track/ping
Authorization: Bearer JWT_TOKEN

{
  "crewId": "uuid",
  "orderId": "uuid",
  "lat": -34.603722,
  "lng": -58.381592,
  "source": "hourly_api"
}
```

## Endpoints

### WebSocket

- `ws://tracking-service:3003/ws/track?token=...` - Conexión WebSocket

### HTTP API

- `POST /track/ping` - Guardar ping de ubicación (requiere JWT)
  - Usado cuando orden está `en_trabajo` (ping cada 1h)
  
- `GET /track/route?crewId=...&orderId=...&from=...&to=...` - Consultar ruta histórica

## Message Types (WebSocket)

### Cliente → Servidor

- `subscribe` - Suscribirse a room
- `unsubscribe` - Desuscribirse
- `location_update` - Enviar ubicación (cada 5-10s)
- `ping` - Mantener conexión

### Servidor → Cliente

- `connected` - Confirmación de conexión
- `order_en_camino` - Evento cuando orden pasa a en_camino
- `location_update` - Actualización de ubicación (broadcast)
- `location_received` - Confirmación de envío
- `subscribed` - Confirmación de suscripción
- `pong` - Respuesta a ping
- `error` - Error en mensaje

## Rooms

- `order:{orderId}` - Sala de una orden específica
- `crew:{crewId}` - Sala de una cuadrilla

Cuando operations-service publica `ORDER_EN_CAMINO`:
- Se broadcast automáticamente a `order:{orderId}`
- También a `crew:{crewId}` si existe
- Esto "abre/sugiere" la sala para cualquier cliente suscrito

## Base de Datos

### CrewPing
- Guarda todos los pings de ubicación
- `source`: `realtime` (WebSocket) o `hourly_api` (HTTP)

### RouteSummary
- Resumen de rutas con distancia calculada
- Se actualiza automáticamente al consultar rutas

## Configuración

```bash
PORT=3003
DATABASE_URL=postgresql://app:app@localhost:3307/app?schema=tracking
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super_access_secret
TRACKING_EVENT_CHANNEL=work_order_events
WS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Ver `INTEGRATION.md` para documentación detallada de la integración.
