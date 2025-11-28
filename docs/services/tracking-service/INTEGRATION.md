# Integración Operations ↔ Tracking

Documentación de la integración entre operations-service y tracking-service usando Redis Pub/Sub y WebSocket.

## Flujo Completo

### 1. Orden pasa a "en_camino"

Cuando operations-service marca una orden como `en_camino`:

```typescript
// PATCH /ops/work-orders/:id/state
{
  "state": "en_camino",
  "note": "Cuadrilla salió hacia destino"
}
```

**Operations Service:**
1. Actualiza estado de la orden en DB
2. Crea evento en timeline
3. Publica evento en Redis Pub/Sub `ORDER_EN_CAMINO`:

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

### 2. Tracking Service recibe evento

**Tracking Service:**
1. Escucha eventos en canal `work_order_events` (configurable)
2. Cuando recibe `ORDER_EN_CAMINO`:
   - **Abre/sugiere sala WebSocket**: `order:{orderId}`
   - Broadcast evento `order_en_camino` a todos los clientes del room
   - Si hay `crewId`, también broadcast al room `crew:{crewId}`
   - Si hay ubicación target, la emite como location inicial

### 3. App Móvil se conecta

**Conexión WebSocket:**
```
ws://tracking-service:3003/ws/track?token=JWT_ACCESS_TOKEN
```

**Autenticación:**
- Token JWT en query string
- Token debe contener `userId`, `roles` (al menos `CREW`)

**Mensaje inicial:**
```json
{
  "type": "connected",
  "message": "WebSocket connection established",
  "userId": "uuid"
}
```

### 4. Suscripción a rooms

**App móvil se suscribe a:**
- `order:{orderId}` - Para recibir actualizaciones de la orden específica
- `crew:{crewId}` - Para recibir actualizaciones de toda la cuadrilla

**Mensaje de suscripción:**
```json
{
  "type": "subscribe",
  "room": "order:abc123"
}
```

**Respuesta:**
```json
{
  "type": "subscribed",
  "room": "order:abc123",
  "success": true
}
```

### 5. Envío de ubicación en tiempo real

Cuando la orden está `en_camino`, la app móvil envía ubicación cada **5-10 segundos**:

**Mensaje:**
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
2. Guarda ping en DB (source: `realtime`)
3. Broadcast a rooms:
   - `crew:{crewId}`
   - `order:{orderId}` (si existe)
4. Confirma recepción:

```json
{
  "type": "location_received",
  "timestamp": "2024-01-15T10:30:05Z",
  "saved": true
}
```

### 6. Orden pasa a "en_trabajo"

Cuando la orden cambia a estado `en_trabajo`, la app móvil cambia el modo:

**Antes (en_camino):**
- WebSocket: `location_update` cada 5-10s

**Después (en_trabajo):**
- API HTTP: `POST /track/ping` cada 1 hora

**Endpoint:**
```
POST /track/ping
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "crewId": "uuid",
  "orderId": "uuid",
  "lat": -34.603722,
  "lng": -58.381592,
  "source": "hourly_api"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "crewId": "uuid",
    "orderId": "uuid",
    "lat": -34.603722,
    "lng": -58.381592,
    "source": "hourly_api",
    "at": "2024-01-15T11:30:00Z"
  }
}
```

## WebSocket Message Types

### Cliente → Servidor

#### `subscribe`
Suscribirse a un room
```json
{
  "type": "subscribe",
  "room": "order:abc123"
}
```

#### `unsubscribe`
Desuscribirse de un room
```json
{
  "type": "unsubscribe",
  "room": "order:abc123"
}
```

#### `location_update`
Enviar ubicación actual (cuando orden en_camino)
```json
{
  "type": "location_update",
  "crewId": "uuid",
  "orderId": "uuid",
  "lat": -34.603722,
  "lng": -58.381592
}
```

#### `ping`
Mantener conexión viva
```json
{
  "type": "ping"
}
```

### Servidor → Cliente

#### `connected`
Confirmación de conexión
```json
{
  "type": "connected",
  "message": "WebSocket connection established",
  "userId": "uuid"
}
```

#### `order_en_camino`
Evento cuando orden pasa a en_camino (desde Redis)
```json
{
  "type": "order_en_camino",
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

#### `location_update`
Actualización de ubicación de cuadrilla
```json
{
  "type": "location_update",
  "crewId": "uuid",
  "orderId": "uuid",
  "lat": -34.603722,
  "lng": -58.381592,
  "timestamp": "2024-01-15T10:30:05Z"
}
```

#### `location_received`
Confirmación de recepción de ubicación
```json
{
  "type": "location_received",
  "timestamp": "2024-01-15T10:30:05Z",
  "saved": true
}
```

#### `subscribed`
Confirmación de suscripción
```json
{
  "type": "subscribed",
  "room": "order:abc123",
  "success": true
}
```

#### `pong`
Respuesta a ping
```json
{
  "type": "pong",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `error`
Error en mensaje
```json
{
  "type": "error",
  "message": "Invalid room format"
}
```

## Configuración

### Variables de Entorno

**Operations Service:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
TRACKING_EVENT_CHANNEL=work_order_events
```

**Tracking Service:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
TRACKING_EVENT_CHANNEL=work_order_events
JWT_SECRET=super_access_secret
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=60000
```

## Ejemplo de Implementación en App Móvil

```typescript
// Conectar WebSocket
const ws = new WebSocket(`ws://tracking-service:3003/ws/track?token=${accessToken}`);

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Suscribirse a orden específica
  ws.send(JSON.stringify({
    type: 'subscribe',
    room: `order:${orderId}`
  }));
  
  // Suscribirse a cuadrilla
  ws.send(JSON.stringify({
    type: 'subscribe',
    room: `crew:${crewId}`
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'order_en_camino':
      // Orden pasó a en_camino, empezar a enviar ubicación
      startLocationTracking();
      break;
      
    case 'location_update':
      // Actualización de ubicación de otra cuadrilla
      updateMap(data);
      break;
      
    case 'location_received':
      // Confirmación de envío exitoso
      console.log('Location saved');
      break;
  }
};

// Enviar ubicación cada 5-10s cuando orden en_camino
function startLocationTracking() {
  const interval = setInterval(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      ws.send(JSON.stringify({
        type: 'location_update',
        crewId: currentCrewId,
        orderId: currentOrderId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }));
    });
  }, 5000); // 5 segundos
}

// Cuando orden pasa a en_trabajo, cambiar a API cada 1 hora
function switchToHourlyPing() {
  clearInterval(locationInterval);
  
  const hourlyInterval = setInterval(async () => {
    const position = await getCurrentPosition();
    
    await fetch('http://tracking-service:3003/track/ping', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crewId: currentCrewId,
        orderId: currentOrderId,
        lat: position.lat,
        lng: position.lng,
        source: 'hourly_api',
      }),
    });
  }, 3600000); // 1 hora
}
```

## Troubleshooting

### WebSocket no recibe eventos de Redis

1. Verificar que Redis esté corriendo
2. Verificar que ambos servicios usen el mismo canal: `TRACKING_EVENT_CHANNEL`
3. Revisar logs de operations-service para ver si publicó evento
4. Revisar logs de tracking-service para ver si recibió evento

### Ubicaciones no se guardan

1. Verificar que el token JWT sea válido
2. Verificar que `crewId` esté en el payload del token
3. Revisar logs de tracking-service para errores de DB

### Rooms no reciben broadcasts

1. Verificar que clientes estén suscritos al room correcto
2. Verificar formato de room: `order:{id}` o `crew:{id}`
3. Revisar logs de WebSocket para conexiones activas

