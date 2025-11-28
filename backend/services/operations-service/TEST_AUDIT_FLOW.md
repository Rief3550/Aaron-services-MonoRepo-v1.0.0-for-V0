# 🧪 Guía de Pruebas - Flujo de Auditoría

## Prerequisitos

1. Servicios corriendo (Docker o local)
2. Token de autenticación válido (ADMIN o OPERATOR)
3. Cliente en estado `PENDIENTE` en la base de datos

## Endpoints del Flujo

### 1. Obtener Clientes Pendientes

```bash
curl -X GET "http://localhost:3100/ops/clients/pending" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
[
  {
    "id": "uuid",
    "nombreCompleto": "Cliente Test",
    "email": "test@example.com",
    "estado": "PENDIENTE"
  }
]
```

---

### 2. Asignar Auditor a Cliente Pendiente

```bash
curl -X POST "http://localhost:3100/ops/clients/{clientId}/assign-auditor" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auditorId": "user-id-del-auditor",
    "auditorNombre": "Juan Pérez"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid",
  "estado": "PENDIENTE",
  "auditorAsignadoId": "user-id-del-auditor",
  "auditorAsignadoNombre": "Juan Pérez",
  "fechaAsignacionAuditor": "2025-11-28T12:00:00.000Z"
}
```

---

### 3. Guardar Formulario de Auditoría

```bash
curl -X POST "http://localhost:3100/ops/audit-forms" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "uuid-del-cliente",
    "tipoTramite": "ALTA",
    "esOriginal": true,
    "planId": "uuid-del-plan",
    "planNombre": "Plan Departamento",
    "cobertura": "Cobertura completa",
    "formaPago": "DEBITO_AUTOMATICO",
    "ejecutivoId": "user-id-del-ejecutivo",
    "ejecutivoNombre": "María González",
    "especificaciones": [
      {
        "cantidad": 1,
        "especificacion": "Mantenimiento mensual",
        "observacion": "Sin observaciones"
      }
    ],
    "datosCompletos": {
      "campo1": "valor1",
      "campo2": "valor2"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid",
  "clientId": "uuid-del-cliente",
  "tipoTramite": "ALTA",
  "completado": false,
  "createdAt": "2025-11-28T12:00:00.000Z"
}
```

---

### 4. Marcar Cliente como EN_PROCESO

```bash
curl -X PATCH "http://localhost:3100/ops/clients/{clientId}/mark-in-process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fechaVisita": "2025-11-28T14:00:00.000Z"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid",
  "estado": "EN_PROCESO",
  "fechaVisitaAuditoria": "2025-11-28T14:00:00.000Z"
}
```

---

### 5. Marcar Formulario como Completado

```bash
curl -X PATCH "http://localhost:3100/ops/audit-forms/{clientId}/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "id": "uuid",
  "completado": true,
  "fechaCompletado": "2025-11-28T15:00:00.000Z",
  "completadoPor": "user-id-del-auditor"
}
```

---

### 6. Activar Cliente (EN_PROCESO → ACTIVO)

```bash
curl -X PATCH "http://localhost:3100/ops/clients/{clientId}/activate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "observaciones": "Cliente activado correctamente"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid",
  "estado": "ACTIVO",
  "datosAdicionales": "Cliente activado correctamente"
}
```

**Nota:** Este endpoint también envía un email de bienvenida al cliente.

---

## Flujo Completo de Prueba

```bash
# 1. Obtener cliente pendiente
CLIENT_ID=$(curl -s -X GET "http://localhost:3100/ops/clients/pending" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# 2. Asignar auditor
curl -X POST "http://localhost:3100/ops/clients/$CLIENT_ID/assign-auditor" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auditorId": "auditor-user-id", "auditorNombre": "Test Auditor"}'

# 3. Guardar formulario
curl -X POST "http://localhost:3100/ops/audit-forms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\": \"$CLIENT_ID\", \"tipoTramite\": \"ALTA\"}"

# 4. Marcar como en proceso
curl -X PATCH "http://localhost:3100/ops/clients/$CLIENT_ID/mark-in-process" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 5. Activar cliente
curl -X PATCH "http://localhost:3100/ops/clients/$CLIENT_ID/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"observaciones": "Cliente activado"}'
```

---

## Verificación de Estados

### Verificar cliente pendiente
```bash
curl -X GET "http://localhost:3100/ops/clients?estado=PENDIENTE" \
  -H "Authorization: Bearer $TOKEN"
```

### Verificar cliente en proceso
```bash
curl -X GET "http://localhost:3100/ops/clients?estado=EN_PROCESO" \
  -H "Authorization: Bearer $TOKEN"
```

### Verificar cliente activo
```bash
curl -X GET "http://localhost:3100/ops/clients?estado=ACTIVO" \
  -H "Authorization: Bearer $TOKEN"
```

### Obtener formulario de auditoría
```bash
curl -X GET "http://localhost:3100/ops/audit-forms/client/{clientId}" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Errores Comunes

1. **401 Unauthorized**: Token expirado o inválido
   - Solución: Obtener nuevo token desde `/auth/login`

2. **403 Forbidden**: Rol insuficiente
   - Solución: Usar token de ADMIN o OPERATOR

3. **404 Not Found**: Cliente no existe
   - Solución: Verificar que el cliente existe con `GET /ops/clients/{id}`

4. **409 Conflict**: Estado incorrecto del cliente
   - Solución: Verificar el estado actual del cliente antes de la operación


