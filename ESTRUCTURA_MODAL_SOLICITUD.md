# 📋 Estructura y Endpoints para Modal de Solicitud

Este documento responde todas las dudas sobre la estructura de datos y endpoints necesarios para implementar el modal de edición de solicitudes.

---

## 1️⃣ ESTRUCTURA DE SOLICITUD QUE LLEGA AL MODAL

### Estructura Completa

Basándome en `SolicitudDetailModal.tsx` y los endpoints del backend, la solicitud tiene esta estructura:

```typescript
interface Solicitud {
  id: string;
  
  // Datos del cliente (anidado o directo)
  client?: {
    id: string;                    // ✅ clientId existe aquí
    userId?: string;
    nombreCompleto?: string;
    razonSocial?: string;
    email?: string;
    telefono?: string;
    telefonoAlt?: string;
    telefonoEmergencia?: string;
    documento?: string;
    tipoDocumento?: string;
    cuilCuit?: string;
    estado?: EstadoCliente;        // PENDIENTE|EN_PROCESO|ACTIVO|SUSPENDIDO|INACTIVO
    
    // Dirección (puede estar aquí o en client directamente)
    calle?: string;
    numero?: string;
    piso?: string;
    departamento?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
    
    // Propiedades (array)
    properties?: Property[];        // ✅ Array de propiedades
    
    // Suscripciones (array)
    subscriptions?: Subscription[]; // ✅ Array de suscripciones
    
    // Auditoría
    auditorAsignadoId?: string;
    auditorAsignadoNombre?: string;
    fechaAsignacionAuditor?: string;
    fechaVisitaAuditoria?: string;
  };
  
  // O puede estar en el nivel superior (fallback)
  clientId?: string;               // ✅ También puede existir aquí directamente
  email?: string;
  phone?: string;
  documento?: string;
  tipoDocumento?: string;
  cuilCuit?: string;
  estadoCliente?: string;
  
  // Propiedades (si no están en client)
  properties?: Property[];
  
  // Dirección (puede estar en nivel superior también)
  address?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  
  // Otra información
  type?: string;
  description?: string;
  createdAt?: string;
  status?: string;
}
```

### Property Structure

```typescript
interface Property {
  id: string;                      // ✅ Property ID existe aquí
  clientId?: string;
  userId?: string;
  address: string;
  lat: number;
  lng: number;
  provincia?: string;
  ciudad?: string;
  barrio?: string;
  tipoPropiedad?: string;          // CASA|DEPARTAMENTO|LOCAL|OTRO
  tipoConstruccion?: string;       // LOSA|CHAPA|MIXTA|OTRO
  ambientes?: number;
  banos?: number;
  superficieCubiertaM2?: number;
  superficieDescubiertaM2?: number;
  summary?: string;
  notes?: string;
  status?: string;                 // PRE_ONBOARD|PRE_APPROVED|ACTIVE|REJECTED
}
```

### Subscription Structure

```typescript
interface Subscription {
  id: string;
  clientId?: string;
  userId?: string;
  propertyId?: string;
  planId: string;                  // ✅ Plan actual está aquí
  status: SubscriptionStatus;      // ACTIVE|REVISION|GRACE|PAST_DUE|SUSPENDED|CANCELED|PAUSED
  fechaInicio: string;
  fechaFin?: string;
  montoMensual?: number;
  moneda?: string;
  
  // Relaciones
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingPeriod?: string;
  };
  
  property?: {
    id: string;
    address: string;
  };
}
```

---

## 2️⃣ IDs DISPONIBLES

### ✅ Respuestas Directas

**¿`solicitud.clientId` existe?**
- **SÍ**, puede estar en:
  - `solicitud.client.id` (recomendado)
  - `solicitud.clientId` (fallback)

**¿La propiedad está en `solicitud.client.properties[0].id`?**
- **SÍ**, pero puede variar:
  - `solicitud.client.properties[0].id` ✅ (si existe client y properties)
  - `solicitud.properties[0].id` ✅ (si properties está en nivel superior)
  - Verificar que `properties` no sea un array vacío

**Código recomendado para obtener IDs:**

```typescript
// Obtener clientId
const clientId = solicitud.client?.id || solicitud.clientId;

// Obtener propertyId (primera propiedad activa o cualquier)
const propertyId = solicitud.client?.properties?.[0]?.id 
                || solicitud.properties?.[0]?.id;

// Verificar si tiene propiedades
const hasProperties = (solicitud.client?.properties?.length || 0) > 0 
                   || (solicitud.properties?.length || 0) > 0;
```

---

## 3️⃣ SUSCRIPCIONES Y PLAN ACTUAL

### ¿Trae suscripciones?

**SÍ**, las suscripciones vienen en:

```typescript
solicitud.client?.subscriptions  // Array de suscripciones
```

### ¿Dónde está el plan actual?

**Estructura:**

```typescript
// Opción 1: Suscripción activa
const activeSubscription = solicitud.client?.subscriptions?.find(
  s => s.status === 'ACTIVE' || s.status === 'REVISION'
);

const currentPlanId = activeSubscription?.planId;
const currentPlan = activeSubscription?.plan;  // { id, name, price, currency }
```

**Notas importantes:**
- Puede haber múltiples suscripciones (historial)
- Buscar la suscripción con `status: 'ACTIVE'` o `'REVISION'`
- Si no hay suscripción activa, el cliente no tiene plan asignado
- El plan puede estar en `subscription.plan` (relación completa) o solo `planId`

**Código para obtener plan actual:**

```typescript
// Función helper
function getCurrentPlan(solicitud: Solicitud) {
  const subscriptions = solicitud.client?.subscriptions || [];
  
  // Buscar suscripción activa
  const activeSub = subscriptions.find(s => 
    s.status === 'ACTIVE' || s.status === 'REVISION'
  );
  
  if (activeSub) {
    return {
      subscriptionId: activeSub.id,
      planId: activeSub.planId,
      plan: activeSub.plan,  // Datos completos del plan
      status: activeSub.status
    };
  }
  
  return null; // No tiene plan asignado
}
```

---

## 4️⃣ PLAN A ASIGNAR

### ¿Debo usar `/plans` y permitir seleccionar uno?

**SÍ**, debes:

1. **Cargar planes disponibles** al abrir el modal:
   ```typescript
   GET /ops/plans
   // O si necesitas incluir inactivos:
   GET /ops/admin/plans
   ```

2. **Mostrar dropdown/selector** para que el operador elija un plan

3. **No hay plan fijo por defecto** - el operador debe seleccionar

**Endpoint para listar planes:**

```http
GET /ops/plans
Authorization: Bearer {accessToken}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Plan Departamento Básico",
    "description": "Plan básico para departamentos",
    "price": 15000,
    "currency": "ARS",
    "billingPeriod": "MONTHLY",
    "active": true
  }
]
```

**Nota:** Si solo necesitas planes activos, usa `/ops/plans`. Si necesitas todos (incluyendo inactivos), usa `/ops/admin/plans`.

---

## 5️⃣ CAMPOS EDITABLES EN EL MODAL

### Cliente - Campos Editables

Basándome en `UpdateClientDto` (línea 128-172):

**✅ Campos que SÍ se pueden editar:**

```typescript
interface UpdateClientDto {
  // Persona
  tipoPersona?: TipoPersona;        // FISICA|JURIDICA
  nombreCompleto?: string;           // ✅ Editable
  razonSocial?: string;              // ✅ Editable (si es jurídica)
  
  // Documentación
  documento?: string;                // ✅ Editable
  // tipoDocumento no está en UpdateClientDto, pero documento sí
  
  // Contacto
  email?: string;                    // ✅ Editable
  telefono?: string;                 // ✅ Editable
  telefonoAlt?: string;              // ✅ Editable
  
  // Dirección
  direccionFacturacion?: string;     // ✅ Editable
  provincia?: string;                // ✅ Editable
  ciudad?: string;                   // ✅ Editable
  codigoPostal?: string;             // ✅ Editable
  
  // Estado (usar endpoint separado)
  // estado → usar PATCH /ops/clients/:id/status
}
```

**❌ Campos que NO están en UpdateClientDto:**
- `cuilCuit` - No aparece en el DTO de actualización
- `lat`/`lng` - No están en UpdateClientDto del cliente (están en Property)

**Endpoint para actualizar cliente:**

```http
PATCH /ops/clients/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nombreCompleto": "Nuevo Nombre",
  "telefono": "+543804123456",
  "documento": "12345678",
  "email": "cliente@example.com",
  "direccionFacturacion": "Nueva dirección",
  "provincia": "La Rioja",
  "ciudad": "La Rioja",
  "codigoPostal": "5300"
}
```

---

### Propiedad - Campos Editables

Basándome en `CreatePropertyDto` y `PUT /ops/properties/:id`:

**✅ Campos que SÍ se pueden editar:**

```typescript
interface UpdatePropertyDto {
  address?: string;                  // ✅ Editable
  lat?: number;                      // ✅ Editable
  lng?: number;                      // ✅ Editable
  provincia?: string;                // ✅ Editable
  ciudad?: string;                   // ✅ Editable
  barrio?: string;                   // ✅ Editable
  tipoPropiedad?: TipoPropiedad;     // ✅ Editable
  tipoConstruccion?: TipoConstruccion; // ✅ Editable
  ambientes?: number;                // ✅ Editable
  banos?: number;                    // ✅ Editable
  superficieCubiertaM2?: number;     // ✅ Editable
  superficieDescubiertaM2?: number;  // ✅ Editable
  summary?: string;                  // ✅ Editable (observaciones)
  // código postal → no aparece explícitamente, pero ciudad/provincia sí
}
```

**Endpoint para actualizar propiedad:**

```http
PUT /ops/properties/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "address": "Nueva dirección 123",
  "lat": -29.408660,
  "lng": -66.858431,
  "ciudad": "La Rioja",
  "provincia": "La Rioja",
  "barrio": "Centro",
  "tipoPropiedad": "DEPARTAMENTO",
  "tipoConstruccion": "LOSA",
  "ambientes": 3,
  "banos": 2,
  "superficieCubiertaM2": 75.5,
  "superficieDescubiertaM2": 10.0,
  "summary": "Observaciones del inmueble"
}
```

**Nota sobre código postal:**
- No aparece explícitamente en el DTO de Property
- Se puede manejar en `summary` o esperar que se agregue al schema si es necesario

---

## 6️⃣ CREAR SUSCRIPCIÓN

### ¿Debo crear suscripción si no tiene y hay plan seleccionado?

**SÍ**, si:
- El cliente no tiene suscripción activa (`getCurrentPlan()` retorna `null`)
- El operador seleccionó un plan en el modal
- El cliente está activo o en proceso de activación

**Endpoint para crear suscripción:**

```http
POST /ops/subscriptions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "userId": "uuid-del-usuario",
  "planId": "uuid-del-plan-seleccionado",
  "propertyId": "uuid-de-la-propiedad",  // Opcional pero recomendado
  "billingDay": 1,                        // Opcional: día del mes (1-28)
  "currentPeriodStart": "2025-12-01T00:00:00Z",  // Opcional
  "currentPeriodEnd": "2026-01-01T00:00:00Z"     // Opcional
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "clientId": "uuid",
  "propertyId": "uuid",
  "planId": "uuid",
  "status": "ACTIVE",
  "fechaInicio": "2025-12-01T00:00:00Z",
  "currentPeriodStart": "2025-12-01T00:00:00Z",
  "currentPeriodEnd": "2026-01-01T00:00:00Z",
  "plan": {
    "id": "uuid",
    "name": "Plan Departamento Básico",
    "price": 15000,
    "currency": "ARS"
  }
}
```

**Campos requeridos:**
- `userId`: ID del usuario (obtener de `solicitud.client.userId` o `solicitud.clientId`)
- `planId`: ID del plan seleccionado

**Campos opcionales pero recomendados:**
- `propertyId`: ID de la propiedad (si existe)
- `billingDay`: Día del mes para facturación (1-28)
- Si no envías `currentPeriodStart/End`, el sistema los calcula automáticamente (hoy + 30 días)

---

## 7️⃣ FLUJO COMPLETO DEL MODAL

### Cargar datos al abrir el modal:

```typescript
async function loadModalData(solicitudId: string) {
  // 1. Cargar solicitud completa (ya viene con client, properties, subscriptions)
  const solicitud = await fetchSolicitudById(solicitudId);
  
  // 2. Cargar planes disponibles
  const plans = await fetchPlans({ activeOnly: true });
  
  // 3. Extraer información
  const clientId = solicitud.client?.id || solicitud.clientId;
  const propertyId = solicitud.client?.properties?.[0]?.id;
  const currentPlan = getCurrentPlan(solicitud);
  
  return {
    solicitud,
    clientId,
    propertyId,
    currentPlan,
    plans
  };
}
```

### Al guardar cambios:

```typescript
async function saveChanges(solicitud: Solicitud, formData: FormData) {
  const clientId = solicitud.client?.id || solicitud.clientId;
  const propertyId = solicitud.client?.properties?.[0]?.id;
  
  try {
    // 1. Actualizar cliente
    if (formData.clientChanged) {
      await updateClient(clientId, {
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        documento: formData.documento,
        email: formData.email,
        direccionFacturacion: formData.direccionFacturacion,
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        codigoPostal: formData.codigoPostal
      });
    }
    
    // 2. Actualizar propiedad (si existe)
    if (propertyId && formData.propertyChanged) {
      await updateProperty(propertyId, {
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        ciudad: formData.ciudad,
        provincia: formData.provincia,
        barrio: formData.barrio,
        tipoPropiedad: formData.tipoPropiedad,
        tipoConstruccion: formData.tipoConstruccion,
        ambientes: formData.ambientes,
        banos: formData.banos,
        superficieCubiertaM2: formData.superficieCubiertaM2,
        superficieDescubiertaM2: formData.superficieDescubiertaM2,
        summary: formData.observacionesPropiedad
      });
    }
    
    // 3. Crear/actualizar suscripción si es necesario
    const currentPlan = getCurrentPlan(solicitud);
    
    if (!currentPlan && formData.selectedPlanId) {
      // Crear nueva suscripción
      await createSubscription({
        userId: solicitud.client?.userId || clientId,
        planId: formData.selectedPlanId,
        propertyId: propertyId,
        billingDay: formData.billingDay || 1
      });
    } else if (currentPlan && formData.selectedPlanId !== currentPlan.planId) {
      // Cambiar plan (upgrade) - usar endpoint de upgrade
      await upgradeSubscription(currentPlan.subscriptionId, {
        planId: formData.selectedPlanId
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving changes:', error);
    throw error;
  }
}
```

---

## 8️⃣ RESUMEN DE ENDPOINTS

### Cliente

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/ops/clients/:id` | Obtener cliente completo (con properties y subscriptions) |
| `PATCH` | `/ops/clients/:id` | Actualizar datos del cliente |
| `PATCH` | `/ops/clients/:id/status` | Actualizar estado del cliente |

### Propiedad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/ops/properties/:id` | Obtener propiedad por ID |
| `PUT` | `/ops/properties/:id` | **Actualizar propiedad completa** ✅ |

### Planes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/ops/plans` | Listar planes activos |
| `GET` | `/ops/admin/plans` | Listar todos los planes (incluye inactivos) |

### Suscripciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/ops/subscriptions` | Listar suscripciones |
| `POST` | `/ops/subscriptions` | **Crear nueva suscripción** ✅ |
| `PATCH` | `/ops/subscriptions/:id/upgrade` | Cambiar plan de suscripción |

---

## 9️⃣ AJUSTE DEL HEADER/CONTRATO

Para no cortar la vista, puedes:

1. **Hacer el modal más alto:**
   ```typescript
   className="max-h-[95vh] flex flex-col"
   ```

2. **Hacer el contenido scrolleable:**
   ```typescript
   className="flex-1 overflow-y-auto"
   ```

3. **Fijar header y footer:**
   ```typescript
   // Header fijo
   <div className="flex-shrink-0">...</div>
   
   // Contenido scrolleable
   <div className="flex-1 overflow-y-auto">...</div>
   
   // Footer fijo
   <div className="flex-shrink-0">...</div>
   ```

Ejemplo completo en `SolicitudDetailModal.tsx` (línea 93):
```typescript
<div className="relative bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full z-10 max-h-[90vh] flex flex-col">
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Cargar planes al abrir modal: `GET /ops/plans`
- [ ] Extraer `clientId` de `solicitud.client.id` o `solicitud.clientId`
- [ ] Extraer `propertyId` de `solicitud.client.properties[0].id`
- [ ] Verificar suscripción actual: `solicitud.client.subscriptions.find(s => s.status === 'ACTIVE')`
- [ ] Mostrar campos editables del cliente
- [ ] Mostrar campos editables de la propiedad
- [ ] Permitir seleccionar plan del dropdown
- [ ] Actualizar cliente: `PATCH /ops/clients/:id`
- [ ] Actualizar propiedad: `PUT /ops/properties/:id`
- [ ] Crear suscripción si no tiene: `POST /ops/subscriptions`
- [ ] Ajustar altura del modal para no cortar vista
- [ ] Manejar errores de validación

---

**Última actualización**: 2025-12-01

