# 🔧 Solución: Creación Automática de Cliente y Suscripción en Signup

## 📋 Problema Identificado

Cuando un cliente se registra desde la app móvil:
1. ✅ Se crea el `User` en `auth-service`
2. ❌ El `Client` NO se creaba inmediatamente - solo se creaba después de verificar el email
3. ❌ La `Subscription` NO se creaba automáticamente

**Resultado:** La app móvil intentaba acceder a:
- `GET /ops/clients/me` → ❌ 404 (cliente no existe)
- `GET /ops/subscriptions/me` → ❌ Error (cliente no existe o sin suscripción)
- `GET /ops/properties/me` → ❌ 404 (cliente no existe)

## ✅ Solución Implementada

### 1. Crear Cliente Inmediatamente en Signup

**Archivo modificado:** `backend/services/auth-service/src/modules/auth/auth.service.ts`

**Cambios:**
- El cliente se crea **inmediatamente** después de crear el usuario (línea ~123)
- **NO espera** la verificación de email
- Esto permite que la app móvil acceda a los endpoints `/me` desde el primer momento

**Código:**
```typescript
// Crear cliente inmediatamente en operations-service (no esperar verificación de email)
// Esto permite que la app móvil pueda acceder a los endpoints /me desde el inicio
if (user.roles.some(r => r.name === 'CUSTOMER')) {
  this.createClientInOperations(user.id, user.email, user.fullName || undefined, dto.lat, dto.lng)
    .catch(err => this.logger.error('Failed to create client in operations during signup', err));
}
```

### 2. Qué se Crea Automáticamente

Cuando se llama a `createClientInOperations()`, se ejecuta:

**Endpoint interno:** `POST /ops/clients/internal/create`

**En `clients.service.ts` → `createFromSignup()`:**

1. **Cliente** (`Client`):
   - `userId`: Vinculado al usuario
   - `email`: Email del usuario
   - `nombreCompleto`: Nombre completo (si está disponible)
   - `estado`: `PENDIENTE` (esperando auditoría)
   - `lat` / `lng`: Coordenadas GPS (si están disponibles)

2. **Propiedad** (`CustomerProperty`):
   - `clientId`: Vinculada al cliente
   - `userId`: Vinculada al usuario
   - `address`: "Sin dirección" (placeholder - se actualizará después)
   - `lat` / `lng`: Coordenadas GPS (si están disponibles)
   - `status`: `PRE_ONBOARD`

3. **Suscripción**: 
   - ❌ **NO se crea automáticamente**
   - Se creará cuando el operador asigne un plan y complete la auditoría

### 3. Flujo Completo

```
┌─────────────────────────────────────┐
│  Cliente hace SIGNUP desde app      │
│  POST /auth/signup                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1. Se crea User en auth-service    │
│     - email, password hash          │
│     - rol: CUSTOMER                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Se crea Client INMEDIATAMENTE   │
│     - estado: PENDIENTE             │
│     - userId vinculado              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Se crea Property INMEDIATAMENTE │
│     - address: "Sin dirección"      │
│     - status: PRE_ONBOARD           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Se envía email de verificación  │
│     (opcional - no bloquea)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Cliente puede usar app móvil    │
│     - GET /ops/clients/me ✅        │
│     - GET /ops/properties/me ✅     │
│     - GET /ops/subscriptions/me     │
│       → retorna null + mensaje      │
└─────────────────────────────────────┘
```

## 🔍 Endpoints que Funcionan Ahora

### ✅ Cliente Puede Acceder Inmediatamente

#### 1. Obtener Mi Perfil
```http
GET /ops/clients/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "email": "cliente@example.com",
  "nombreCompleto": "Nombre Cliente",
  "estado": "PENDIENTE",
  "lat": -29.408660,
  "lng": -66.858431,
  "properties": [
    {
      "id": "uuid",
      "address": "Sin dirección",
      "status": "PRE_ONBOARD"
    }
  ],
  "subscriptions": []
}
```

#### 2. Obtener Mis Propiedades
```http
GET /ops/properties/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "address": "Sin dirección",
    "lat": -29.408660,
    "lng": -66.858431,
    "status": "PRE_ONBOARD"
  }
]
```

#### 3. Obtener Mi Suscripción
```http
GET /ops/subscriptions/me
Authorization: Bearer {accessToken}
```

**Response (200) - Sin suscripción:**
```json
{
  "subscription": null,
  "clientStatus": "PENDIENTE",
  "message": "Tu cuenta está pendiente de auditoría"
}
```

**Response (200) - Con suscripción activa:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "ACTIVE",
    "plan": {
      "name": "Plan Departamento Básico",
      "price": 15000
    }
  },
  "clientStatus": "ACTIVO",
  "payments": []
}
```

## ⚠️ Estado PENDIENTE

Mientras el cliente está en estado `PENDIENTE`:

- ✅ Puede acceder a los endpoints `/me`
- ✅ Puede ver su perfil y propiedades
- ❌ **NO puede** solicitar órdenes de trabajo
- ❌ **NO tiene** suscripción activa
- ❌ **NO puede** usar servicios del plan

El cliente aparecerá en el panel de **Solicitudes** del backoffice esperando que un operador:
1. Complete los datos del inmueble
2. Asigne un plan
3. Cree la suscripción
4. Complete la auditoría
5. Active el cliente

## 🔄 Próximos Pasos

Después de que el operador procese al cliente:

1. **Cliente activado** → Estado cambia a `ACTIVO`
2. **Suscripción creada** → Con plan asignado
3. **Propiedad actualizada** → Con datos completos
4. **Email de bienvenida** → Enviado automáticamente

Luego el cliente podrá:
- ✅ Solicitar órdenes de trabajo
- ✅ Acceder a servicios del plan
- ✅ Usar todas las funcionalidades

## 📝 Notas Técnicas

### Manejo de Errores

Si `operations-service` no está disponible durante el signup:
- El error se logea pero **NO falla** el signup
- El usuario puede iniciar sesión normalmente
- El cliente se creará cuando el servicio esté disponible (en el próximo login o verificación de email)

### Idempotencia

El método `createFromSignup()` verifica si el cliente ya existe:
- Si ya existe con el mismo `userId` → Lanza `ConflictException`
- Si ya existe con el mismo `email` → Lanza `ConflictException`

Esto previene duplicados.

### Verificación de Email

La verificación de email ahora es opcional para el flujo básico:
- El cliente ya existe antes de verificar
- La verificación solo actualiza el flag `isEmailVerified`
- No bloquea el acceso a los endpoints

## ✅ Checklist de Verificación

- [x] Cliente se crea inmediatamente en signup
- [x] Propiedad se crea automáticamente
- [x] Endpoints `/me` funcionan sin suscripción
- [x] Manejo correcto de casos sin suscripción
- [x] Error handling robusto
- [x] Prevención de duplicados

---

**Fecha de implementación**: 2025-12-02
**Versión**: 1.0.0



