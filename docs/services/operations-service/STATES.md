# Estados y Transiciones

Sistema de estados y transiciones validadas para órdenes de trabajo y cuadrillas.

## Órdenes de Trabajo

### Flujo Principal

```
pendiente → asignada → confirmada → en_camino → visitada_no_finalizada → visitada_finalizada
```

### Estados

- **pendiente**: Orden creada, esperando asignación
- **asignada**: Asignada a una cuadrilla
- **confirmada**: Confirmada por la cuadrilla
- **en_camino**: Cuadrilla en camino (dispara evento a tracking)
- **visitada_no_finalizada**: Visitada pero no completada (puede durar múltiples días)
- **visitada_finalizada**: Completada (estado final)

### Estados Alternativos

- **pausada**: Pausada temporalmente (desde: asignada, confirmada, en_camino, visitada_no_finalizada)
- **cancelada**: Cancelada (desde: pendiente, asignada, confirmada, en_camino) (estado final)
- **suspendida**: Suspendida (desde: asignada, confirmada) (puede reactivarse)

### Transiciones Válidas

| Desde | Permite |
|-------|---------|
| `pendiente` | `asignada`, `cancelada` |
| `asignada` | `confirmada`, `pausada`, `cancelada`, `suspendida` |
| `confirmada` | `en_camino`, `pausada`, `cancelada`, `suspendida` |
| `en_camino` | `visitada_no_finalizada`, `pausada`, `cancelada` |
| `visitada_no_finalizada` | `visitada_finalizada`, `pausada`, `suspendida` |
| `visitada_finalizada` | _(ninguno - estado final)_ |
| `pausada` | `asignada`, `confirmada`, `en_camino`, `visitada_no_finalizada`, `cancelada` |
| `cancelada` | _(ninguno - estado final)_ |
| `suspendida` | `asignada`, `confirmada`, `cancelada` |

### Validación

Todas las transiciones son validadas antes de aplicar. Si una transición no es válida, se retorna error.

**Ejemplo de error:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid transition: pendiente -> visitada_finalizada. Allowed: asignada, cancelada"
  }
}
```

## Cuadrillas

### Flujo Principal

```
desocupado → en_camino → en_trabajo → en_progreso (con progress%) → desocupado
```

### Estados

- **desocupado**: Sin órdenes asignadas
- **en_camino**: En camino a una orden (cuando orden está en_camino)
- **en_trabajo**: Trabajando en una orden (cuando orden está visitada_no_finalizada)
- **en_progreso**: Trabajando con progreso porcentual (0-100%)

### Transiciones Válidas

| Desde | Permite |
|-------|---------|
| `desocupado` | `en_camino`, `en_trabajo` |
| `en_camino` | `en_trabajo`, `desocupado` |
| `en_trabajo` | `en_progreso`, `desocupado` |
| `en_progreso` | `en_trabajo`, `desocupado` |

### Progress y en_progreso

- Cuando `state === 'en_progreso'`, `progress` debe estar entre 0-100
- `en_progreso` es un estado especial que permite actualizar el progreso sin cambiar el estado principal
- Cuando `progress === 100` y no hay más órdenes activas, automáticamente pasa a `desocupado`

## Audit Trail (WorkOrderEvent)

Cada cambio de estado genera un evento en `WorkOrderEvent` con:

- `workOrderId`: ID de la orden
- `type`: Estado nuevo
- `at`: Timestamp del cambio
- `note`: Nota descriptiva
- `meta`: Metadata adicional (fromState, toState, timestamp, etc.)

**Ejemplo de evento:**
```json
{
  "id": "uuid",
  "workOrderId": "uuid",
  "type": "en_camino",
  "at": "2024-01-15T10:30:00Z",
  "note": "Estado cambiado de confirmada a en_camino",
  "meta": {
    "fromState": "confirmada",
    "toState": "en_camino",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Timeline Agrupado por Jornada

Cuando una orden en `visitada_no_finalizada` dura múltiples días, el timeline se puede agrupar por jornada.

### Endpoint

```
GET /work-orders/:id/timeline?analyze=true
```

### Respuesta

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "totalEvents": 15,
    "totalDurationDays": 3,
    "hasMultipleDays": true,
    "groups": [
      {
        "date": "2024-01-15",
        "events": [...],
        "startTime": "2024-01-15T08:00:00Z",
        "endTime": "2024-01-15T18:00:00Z",
        "durationHours": 10,
        "productivity": {
          "totalEvents": 5,
          "stateChanges": 3,
          "timeInActiveStates": 7.5,
          "efficiency": 0.75
        }
      },
      {
        "date": "2024-01-16",
        "events": [...],
        "startTime": "2024-01-16T08:00:00Z",
        "endTime": "2024-01-16T17:00:00Z",
        "durationHours": 9,
        "productivity": {
          "totalEvents": 5,
          "stateChanges": 2,
          "timeInActiveStates": 8,
          "efficiency": 0.89
        }
      }
    ],
    "productivity": {
      "averageEfficiency": 0.82,
      "totalActiveHours": 15.5,
      "waitingHours": 3.5
    }
  }
}
```

### Productividad

- **totalActiveHours**: Horas en estados activos (en_camino, visitada_no_finalizada, visitada_finalizada)
- **waitingHours**: Horas en estados de espera (asignada, confirmada, pausada, etc.)
- **efficiency**: Ratio de tiempo activo / tiempo total (0-1)
- **averageEfficiency**: Eficiencia promedio de todas las jornadas

## Sincronización Automática

### Orden → Cuadrilla

Cuando una orden cambia de estado, el estado de la cuadrilla se sincroniza automáticamente:

- `orden: en_camino` → `cuadrilla: en_camino`
- `orden: visitada_no_finalizada` → `cuadrilla: en_trabajo`
- `orden: visitada_finalizada` → Si no hay más órdenes activas: `cuadrilla: desocupado`

### Progress → Cuadrilla

Cuando se actualiza el progress de una orden:
- Si `progress > 0 && progress < 100` y cuadrilla está en `en_trabajo` → `en_progreso`
- Si `progress === 100` y no hay más órdenes → `desocupado`

## Ejemplos de Uso

### Cambiar estado de orden

```bash
PATCH /ops/work-orders/:id/state
{
  "state": "en_camino",
  "note": "Cuadrilla salió hacia destino"
}
```

### Actualizar progreso

```bash
PATCH /ops/work-orders/:id/progress
{
  "progress": 75
}
```

### Obtener timeline con análisis

```bash
GET /ops/work-orders/:id/timeline?analyze=true
```

## Notas

- No se pueden cambiar estados finales (`visitada_finalizada`, `cancelada`)
- Las transiciones se validan antes de aplicar
- Cada cambio genera un evento en el timeline
- El timeline agrupado por jornada es útil para órdenes que duran múltiples días

