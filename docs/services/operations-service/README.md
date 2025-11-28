# Operations Service

Servicio de gestión de operaciones para Aaron Backend.

## Funcionalidades

- ✅ **Suscripciones**: Alta/baja/upgrade, control de días desde pago
- ✅ **Planes y Precios**: Histórico de precios, vigencias
- ✅ **Órdenes de Trabajo**: Estados completos con timeline
- ✅ **Cuadrillas**: Gestión de estado y progreso
- ✅ **Agenda**: Trazabilidad multi-día
- ✅ **Métricas**: Por tipo de reclamo, tiempos, materiales, costos
- ✅ **Eventos**: Publicación a tracking-service cuando orden pasa a "en_camino"

## Endpoints

### Planes

- `GET /plans` - Listar planes
- `POST /plans` - Crear plan
- `PATCH /plans/:id` - Actualizar plan
- `GET /plans/:id/price-history` - Histórico de precios

### Suscripciones

- `GET /subscriptions` - Listar suscripciones
- `POST /subscriptions` - Crear suscripción
- `PATCH /subscriptions/:id/upgrade` - Upgrade de suscripción
- `PATCH /subscriptions/:id/cancel` - Cancelar suscripción
- `PATCH /subscriptions/:id/charge` - Procesar cargo

### Órdenes de Trabajo

- `GET /work-orders` - Listar órdenes
- `POST /work-orders` - Crear orden
- `PATCH /work-orders/:id/state` - Cambiar estado
- `PATCH /work-orders/:id/assign-crew/:crewId` - Asignar cuadrilla
- `PATCH /work-orders/:id/progress` - Actualizar progreso (%)
- `GET /work-orders/:id/timeline` - Obtener timeline de eventos

### Cuadrillas

- `GET /crews` - Listar cuadrillas
- `POST /crews` - Crear cuadrilla
- `GET /crews/:id` - Obtener cuadrilla con órdenes
- `PATCH /crews/:id/state` - Actualizar estado

## Estados de Órdenes de Trabajo

- `pendiente` - Orden creada, esperando asignación
- `asignada` - Asignada a una cuadrilla
- `confirmada` - Confirmada por la cuadrilla
- `en_camino` - Cuadrilla en camino (dispara evento a tracking)
- `visitada_no_finalizada` - Visitada pero no completada
- `visitada_finalizada` - Completada
- `pausada` - Pausada temporalmente
- `cancelada` - Cancelada
- `suspendida` - Suspendida

## Estados de Cuadrillas

- `en_trabajo` - Ocupada con una orden
- `desocupado` - Disponible
- `en_camino` - En camino a una ubicación
- `en_progreso` - Trabajando (con % de progreso)

## Eventos a Tracking Service

Cuando una orden de trabajo cambia de estado a `en_camino`, el servicio publica un evento a tracking-service vía Redis pub/sub o HTTP:

```json
{
  "orderId": "uuid",
  "crewId": "uuid",
  "customerLocation": {
    "address": "Calle 123",
    "location": { "lat": -34.6, "lng": -58.4 }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Configuración

### Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

### Redis

El servicio usa Redis para publicar eventos a tracking-service. Configurar:
- `REDIS_HOST`
- `REDIS_PORT`

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# Desarrollo
pnpm dev

# Build
pnpm build

# Producción
pnpm start
```

## Base de Datos

El servicio usa el schema `operations` en la base de datos compartida.

### Modelos Principales

- `Plan` - Planes de suscripción
- `Subscription` - Suscripciones activas
- `PriceHistory` - Histórico de precios
- `WorkOrder` - Órdenes de trabajo
- `WorkOrderEvent` - Timeline de eventos de órdenes
- `Crew` - Cuadrillas
- `Metric` - Métricas del sistema

