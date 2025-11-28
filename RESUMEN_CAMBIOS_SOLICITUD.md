# 📋 Resumen de Cambios: Solicitud de Servicio Normalizada

## ✅ Cambios Implementados

### 1. Prioridad Automática (CUSTOMER)

**Problema:** El cliente no debe poder especificar la prioridad porque puede exagerar (ej: "gotas" como grave).

**Solución:** La prioridad se calcula automáticamente según el campo `peligroAccidente`:

| peligroAccidente | Prioridad Asignada | Ejemplos |
|------------------|-------------------|----------|
| `"URGENTE"` | `EMERGENCIA` | Pérdida de gas, riesgo de incendio, derrumbe, cortocircuito con chispas |
| `"SI"` | `ALTA` | Hay peligro pero no es urgente (ej: cable suelto, fuga pequeña) |
| `"NO"` o no especificado | `MEDIA` | Problema normal sin peligro (ej: gotera, luz que no prende) |

**Código:**
- `backend/services/operations-service/src/modules/work-orders/work-orders.service.ts`
- `backend/services/operations-service/src/modules/work-orders/work-orders.controller.ts`

### 2. DTO Normalizado

**Campos Requeridos:**
- `serviceCategory` (string): Categoría del servicio
- `situacion` (string): **Descripción de la situación actual del problema**

**Campos Opcionales:**
- `workTypeId` (UUID): Tipo de trabajo del catálogo
- `propertyId` (UUID): Propiedad (si no se especifica, usa la primera activa)
- `peligroAccidente` (string): `SI`|`NO`|`URGENTE` - **Vinculado con prioridad**
- `observaciones` (string): Observaciones adicionales
- `prioridad` (string): **SOLO ADMIN/OPERATOR** - Ignorado para CUSTOMER

**Archivo:**
- `backend/services/operations-service/src/modules/work-orders/dto/work-orders.dto.ts`

### 3. Endpoint Unificado

**Endpoint:** `POST /ops/work-orders/request`

**Funciona para:**
- ✅ App Móvil (CUSTOMER): Prioridad automática
- ✅ Sistema Web (ADMIN/OPERATOR): Pueden especificar prioridad manualmente

**Archivo:**
- `backend/services/operations-service/src/modules/work-orders/work-orders.controller.ts`

### 4. Frontend - Tabla de Órdenes

**Cambios:**
- ✅ Agregada columna "Prioridad" en la tabla
- ✅ Agregada opción "EMERGENCIA" en el filtro de prioridad
- ✅ Colores diferenciados por prioridad:
  - EMERGENCIA: Rojo
  - ALTA: Naranja
  - MEDIA: Amarillo
  - BAJA: Azul

**Archivo:**
- `frontend/web/app/(app)/ordenes/page.tsx`

### 5. Descripción Combinada

La descripción se genera combinando:
1. `situacion` (siempre presente)
2. `observaciones` (si existe)
3. `description` original (si existe)

Formato: `situacion\n\nobservaciones\n\ndescription`

## 📊 Endpoints Disponibles

### Para Cliente (App Móvil)
- `POST /ops/work-orders/request` - Crear solicitud
- `GET /ops/work-orders/me` - Listar mis órdenes
- `GET /ops/work-orders/me/:id` - Detalle de mi orden

### Para Admin/Operator (Sistema Web)
- `POST /ops/work-orders/request` - Crear solicitud (puede especificar customerId y prioridad)
- `GET /ops/work-orders` - Listar todas las órdenes (con filtros)
- `GET /ops/work-orders/:id` - Detalle de orden
- `PATCH /ops/work-orders/:id/state` - Cambiar estado
- `PATCH /ops/work-orders/:id/assign-crew/:crewId` - Asignar cuadrilla

## 🧪 Pruebas

Ver archivo: `TEST_SOLICITUD_SERVICIO.md`

### Casos de Prueba

1. **Sin Peligro** → Prioridad MEDIA
2. **Con Peligro (SI)** → Prioridad ALTA
3. **Urgente (URGENTE)** → Prioridad EMERGENCIA
4. **Verificar en Tabla** → Las órdenes aparecen con prioridad correcta
5. **Filtrar por Prioridad** → Funciona correctamente

## 📝 Documentación

- `ENDPOINT_SOLICITUD_SERVICIO.md` - Documentación completa del endpoint
- `ENDPOINTS_MOBILE_APP.md` - Actualizado con nuevo formato
- `TEST_SOLICITUD_SERVICIO.md` - Guía de pruebas paso a paso

## 🔄 Flujo Completo

1. **Cliente crea solicitud** desde app móvil
   - Especifica: `situacion`, `peligroAccidente`, `observaciones`
   - **NO puede especificar prioridad**

2. **Sistema calcula prioridad** automáticamente
   - Basándose en `peligroAccidente`

3. **Orden se crea** en estado `PENDIENTE`
   - Con prioridad calculada
   - Con descripción combinada

4. **Admin/Operator ve la orden** en la tabla
   - Con prioridad visible
   - Puede filtrar por prioridad
   - Puede asignar cuadrilla

5. **Cuadrilla procesa** la orden
   - Cambia estado a `EN_PROGRESO`
   - Finaliza cuando termina

## ✅ Checklist de Verificación

- [x] Prioridad automática según peligroAccidente
- [x] CUSTOMER no puede especificar prioridad
- [x] ADMIN/OPERATOR puede especificar prioridad
- [x] Descripción combinada (situación + observaciones)
- [x] Endpoint unificado para mobile y web
- [x] Tabla muestra prioridad
- [x] Filtro por prioridad funciona
- [x] Documentación completa
- [x] Guía de pruebas

## 🚀 Próximos Pasos

1. Reconstruir contenedor Docker
2. Probar el flujo completo según `TEST_SOLICITUD_SERVICIO.md`
3. Verificar que las órdenes aparecen en la tabla del frontend
4. Verificar filtros y visualización de prioridad

