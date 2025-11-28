# 🧪 Prueba: Solicitud de Servicio

## Objetivo

Probar el flujo completo de solicitud de servicio:
1. Crear orden desde app móvil (CUSTOMER)
2. Verificar que la prioridad se calcula automáticamente
3. Verificar que aparece en la tabla de órdenes del sistema web

## Prerequisitos

1. Usuario cliente activo con email verificado
2. Cliente en estado ACTIVO
3. Propiedad activa
4. Suscripción activa
5. Token de autenticación válido

## Paso 1: Obtener Token del Cliente

```bash
curl -X POST "http://localhost:3100/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "password": "Test123456!"
  }' | jq '.data.tokens.accessToken' -r
```

Guardar el token en variable:
```bash
CUSTOMER_TOKEN="tu_token_aqui"
```

## Paso 2: Obtener Tipos de Trabajo Disponibles

```bash
curl -X GET "http://localhost:3100/ops/work-types" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" | jq '.[0] | {id, nombre}'
```

Guardar el workTypeId si existe.

## Paso 3: Crear Solicitud de Servicio (Sin Peligro)

```bash
curl -X POST "http://localhost:3100/ops/work-orders/request" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCategory": "plomería",
    "situacion": "Goteo constante en el grifo de la cocina",
    "peligroAccidente": "NO",
    "observaciones": "El goteo comenzó hace 2 días, no es urgente pero molesto"
  }' | jq '.'
```

**Verificar:**
- ✅ Estado: `PENDIENTE`
- ✅ Prioridad: `MEDIA` (calculada automáticamente)
- ✅ Descripción contiene: situación + observaciones

## Paso 4: Crear Solicitud de Servicio (Con Peligro)

```bash
curl -X POST "http://localhost:3100/ops/work-orders/request" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCategory": "gas",
    "situacion": "Olor fuerte a gas en toda la vivienda",
    "peligroAccidente": "URGENTE",
    "observaciones": "Ya cerré la llave de paso del gas y abrí todas las ventanas"
  }' | jq '.'
```

**Verificar:**
- ✅ Estado: `PENDIENTE`
- ✅ Prioridad: `EMERGENCIA` (calculada automáticamente)
- ✅ Descripción contiene: situación + observaciones

## Paso 5: Crear Solicitud de Servicio (Peligro Moderado)

```bash
curl -X POST "http://localhost:3100/ops/work-orders/request" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCategory": "electricidad",
    "situacion": "Cable suelto en el patio, puede ser peligroso si llueve",
    "peligroAccidente": "SI",
    "observaciones": "El cable está colgando cerca de una zona donde se acumula agua"
  }' | jq '.'
```

**Verificar:**
- ✅ Estado: `PENDIENTE`
- ✅ Prioridad: `ALTA` (calculada automáticamente)
- ✅ Descripción contiene: situación + observaciones

## Paso 6: Obtener Token de Admin/Operator

```bash
curl -X POST "http://localhost:3100/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aaron.com",
    "password": "admin123"
  }' | jq '.data.tokens.accessToken' -r
```

Guardar el token:
```bash
ADMIN_TOKEN="tu_token_admin_aqui"
```

## Paso 7: Listar Órdenes de Trabajo (Sistema Web)

```bash
curl -X GET "http://localhost:3100/ops/work-orders" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" | jq '.[0:3] | .[] | {id, serviceCategory, state, prioridad, description}'
```

**Verificar:**
- ✅ Aparecen las 3 órdenes creadas
- ✅ Prioridades correctas: MEDIA, EMERGENCIA, ALTA
- ✅ Descripciones completas con situación y observaciones

## Paso 8: Filtrar por Prioridad

```bash
# Filtrar solo emergencias
curl -X GET "http://localhost:3100/ops/work-orders?prioridad=EMERGENCIA" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" | jq '.[] | {id, serviceCategory, prioridad}'
```

**Verificar:**
- ✅ Solo aparece la orden con prioridad EMERGENCIA

## Paso 9: Verificar en Base de Datos

```bash
PGPASSWORD=devAS.team psql -h localhost -p 5432 -U root -d postgres -c "
SELECT 
  id, 
  \"serviceCategory\", 
  prioridad, 
  state,
  LEFT(description, 50) as descripcion_corta,
  \"createdAt\"
FROM operations.work_orders 
WHERE \"customerId\" = '66387515-341d-472a-806a-1f95e507bf08'
ORDER BY \"createdAt\" DESC 
LIMIT 3;
"
```

**Verificar:**
- ✅ Las 3 órdenes están en la base de datos
- ✅ Prioridades correctas según peligroAccidente
- ✅ Descripciones completas

## Paso 10: Verificar Eventos del Timeline

```bash
PGPASSWORD=devAS.team psql -h localhost -p 5432 -U root -d postgres -c "
SELECT 
  wo.id as orden_id,
  wo.prioridad,
  woe.note,
  woe.meta->>'peligroAccidente' as peligro_accidente
FROM operations.work_orders wo
JOIN operations.work_order_events woe ON wo.id = woe.\"workOrderId\"
WHERE wo.\"customerId\" = '66387515-341d-472a-806a-1f95e507bf08'
  AND woe.type = 'PENDIENTE'
ORDER BY wo.\"createdAt\" DESC 
LIMIT 3;
"
```

**Verificar:**
- ✅ Los eventos contienen la información de peligroAccidente
- ✅ Las notas incluyen situación y peligro

## Verificación en Frontend

1. **Abrir el sistema web:** http://localhost:3100/ordenes
2. **Verificar que aparecen las órdenes:**
   - ID de la orden
   - Categoría de servicio
   - Dirección
   - Estado (PENDIENTE)
   - Prioridad (debe mostrarse si está en la tabla)

3. **Filtrar por prioridad:**
   - Seleccionar filtro "EMERGENCIA"
   - Verificar que solo aparece la orden con prioridad EMERGENCIA

4. **Abrir detalle de orden:**
   - Click en una orden
   - Verificar que muestra:
     - Situación
     - Observaciones
     - Prioridad
     - Estado

## Resultados Esperados

✅ **Prioridad Automática:**
- `peligroAccidente = "NO"` → `prioridad = "MEDIA"`
- `peligroAccidente = "SI"` → `prioridad = "ALTA"`
- `peligroAccidente = "URGENTE"` → `prioridad = "EMERGENCIA"`

✅ **Descripción Completa:**
- Contiene situación + observaciones combinadas

✅ **Tabla de Órdenes:**
- Las órdenes aparecen correctamente
- Filtros funcionan
- Prioridades se muestran correctamente

## Notas

- El cliente NO puede especificar prioridad manualmente
- La prioridad se calcula automáticamente según `peligroAccidente`
- ADMIN/OPERATOR pueden especificar prioridad manualmente si lo desean
- Las órdenes se crean en estado `PENDIENTE` y luego se asignan a cuadrillas

