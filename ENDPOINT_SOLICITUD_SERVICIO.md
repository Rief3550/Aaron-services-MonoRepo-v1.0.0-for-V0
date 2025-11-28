# 📋 Endpoint Normalizado: Solicitud de Servicio

## Descripción

Endpoint unificado para solicitar órdenes de trabajo desde:
- **App Móvil** (CUSTOMER)
- **Sistema Web** (ADMIN/OPERATOR)

## Endpoint

```http
POST /ops/work-orders/request
Authorization: Bearer {accessToken}
Content-Type: application/json
```

## Roles Permitidos

- `CUSTOMER`: Crea orden para su propia cuenta
- `ADMIN`: Puede crear orden para cualquier cliente
- `OPERATOR`: Puede crear orden para cualquier cliente

## DTO: CreateWorkOrderRequestDto

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `serviceCategory` | string | Categoría del servicio: `plomería`\|`electricidad`\|`gas`\|`pintura`\|`emergencia`\|etc. |
| `situacion` | string | **Descripción de la situación actual del problema** |

### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `workTypeId` | UUID | ID del tipo de trabajo del catálogo |
| `propertyId` | UUID | ID de la propiedad (si no se especifica, usa la primera activa del cliente) |
| `peligroAccidente` | string | **Indica si hay peligro o riesgo de accidente**: `SI`\|`NO`\|`URGENTE` |
| `observaciones` | string | **Observaciones adicionales del cliente** |
| `description` | string | Descripción detallada (se combina con situación y observaciones) |
| `prioridad` | string | **SOLO ADMIN/OPERATOR**: `BAJA`\|`MEDIA`\|`ALTA`\|`EMERGENCIA` (ignorado para CUSTOMER, se calcula automáticamente) |
| `canal` | string | `APP`\|`WEB`\|`TELEFONO`\|`WHATSAPP` (default: `APP`) |
| `cantidadEstimada` | number | Cantidad estimada del trabajo |
| `unidadCantidad` | string | `m2`\|`hora`\|`visita`\|`unidad` |
| `customerId` | UUID | Solo para ADMIN/OPERATOR: ID del cliente para quien se crea la orden |

## Ejemplo de Request (App Móvil)

```json
{
  "workTypeId": "4569bc5a-b6ac-4970-84bf-3b633b6f9755",
  "serviceCategory": "plomería",
  "situacion": "Fuga de agua en la cocina, el agua está goteando constantemente desde el grifo",
  "peligroAccidente": "NO",
  "observaciones": "La fuga comenzó esta mañana, ya cerré la llave de paso general para evitar más daños",
  "prioridad": "MEDIA",
  "cantidadEstimada": 1,
  "unidadCantidad": "visita"
}
```

## Ejemplo de Request (Sistema Web - Admin/Operator)

```json
{
  "customerId": "46945dfa-143b-4a7e-b97b-5efe82b10ac4",
  "workTypeId": "4569bc5a-b6ac-4970-84bf-3b633b6f9755",
  "serviceCategory": "electricidad",
  "situacion": "Cortocircuito en el tablero principal, se cortó la luz en toda la casa",
  "peligroAccidente": "URGENTE",
  "observaciones": "El cliente reportó chispas en el tablero, hay riesgo de incendio",
  "prioridad": "EMERGENCIA",
  "canal": "WEB"
}
```

## Ejemplo de Request (Emergencia)

```json
{
  "serviceCategory": "gas",
  "situacion": "Olor fuerte a gas en toda la vivienda",
  "peligroAccidente": "URGENTE",
  "observaciones": "Ya cerré la llave de paso del gas y abrí todas las ventanas",
  "canal": "APP"
}
```

## Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-orden",
    "clientId": "uuid-del-cliente",
    "customerId": "uuid-del-usuario",
    "propertyId": "uuid-de-la-propiedad",
    "subscriptionId": "uuid-de-la-suscripcion",
    "workTypeId": "uuid-del-tipo-trabajo",
    "address": "Av. San Martín 1234, La Rioja",
    "lat": -29.408660,
    "lng": -66.858431,
    "serviceCategory": "plomería",
    "description": "Fuga de agua en la cocina, el agua está goteando constantemente desde el grifo\n\nLa fuga comenzó esta mañana, ya cerré la llave de paso general para evitar más daños",
    "notasCliente": "La fuga comenzó esta mañana, ya cerré la llave de paso general para evitar más daños",
    "prioridad": "MEDIA",
    "canal": "APP",
    "state": "PENDIENTE",
    "cantidad": 1,
    "unidadCantidad": "visita",
    "createdAt": "2025-11-28T10:00:00Z",
    "property": {
      "alias": null,
      "address": "Av. San Martín 1234, La Rioja, La Rioja"
    },
    "workType": {
      "id": "uuid",
      "nombre": "Reparación de cañería"
    }
  }
}
```

## Lógica de Negocio

### Prioridad Automática (CUSTOMER)

**IMPORTANTE:** Los clientes NO pueden especificar la prioridad. Se calcula automáticamente según el campo `peligroAccidente`:

| peligroAccidente | Prioridad Asignada | Ejemplos |
|------------------|-------------------|----------|
| `"URGENTE"` | `EMERGENCIA` | Pérdida de gas, riesgo de incendio, derrumbe, cortocircuito con chispas |
| `"SI"` | `ALTA` | Hay peligro pero no es urgente (ej: cable suelto, fuga pequeña) |
| `"NO"` o no especificado | `MEDIA` | Problema normal sin peligro (ej: gotera, luz que no prende) |

### Prioridad Manual (ADMIN/OPERATOR)

Los administradores y operadores pueden especificar la prioridad manualmente en el campo `prioridad`. Si no la especifican, se calcula igual que para CUSTOMER.

### Descripción Combinada

El campo `description` se genera combinando:
1. `situacion` (siempre presente)
2. `observaciones` (si existe)
3. `description` original (si existe)

Formato: `situacion\n\nobservaciones\n\ndescription`

### Validaciones

1. El cliente debe estar en estado `ACTIVO`
2. Debe tener al menos una propiedad activa
3. Debe tener una suscripción activa
4. Si `propertyId` se especifica, debe pertenecer al cliente

## Evento Inicial

Se crea automáticamente un evento en el timeline con:
- Tipo: `PENDIENTE`
- Nota: Incluye situación y peligro de accidente
- Metadata: Contiene `situacion`, `peligroAccidente`, `observaciones`, `canal`

## Estados de la Orden

La orden se crea en estado `PENDIENTE` y luego puede pasar a:
- `ASIGNADA` → Cuando se asigna una cuadrilla
- `EN_PROGRESO` → Cuando comienza el trabajo
- `FINALIZADA` → Cuando se completa
- `CANCELADA` → Si se cancela

## Notas para Desarrollo

- El endpoint es el mismo para mobile y web
- La diferencia está en los roles y permisos
- ADMIN/OPERATOR pueden especificar `customerId` en el body
- CUSTOMER siempre usa su propio `userId` (no puede especificar `customerId`)

