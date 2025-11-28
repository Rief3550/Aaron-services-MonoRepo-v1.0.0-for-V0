# Flujo Completo de Suscripción - Cliente a Suscripción Activa

## 📋 Resumen del Flujo

Este documento describe el flujo completo desde que un cliente se registra hasta que tiene una suscripción activa.

---

## 🔄 Flujo Paso a Paso

### **PASO 1: Registro del Cliente (Signup)**

**Endpoint:** `POST /auth/signup`

**Qué sucede:**
1. El cliente se registra en el sistema con email, password y nombre completo
2. Se crea un **User** en el schema `auth` con rol `CUSTOMER`
3. Se genera un token JWT con los roles del usuario
4. **Automáticamente** se crea un **Client** en el schema `operations` con:
   - `estado: PENDIENTE` (esperando auditoría)
   - `userId` vinculado al User del auth service
   - Datos básicos (email, nombre)

**Código relevante:**
- `backend/services/auth-service/src/modules/auth/auth.service.ts` (línea 67-145)
- `backend/services/operations-service/src/modules/clients/clients.service.ts` (método `createFromSignup`)

**Estado del Cliente:** `PENDIENTE`

---

### **PASO 2: Cliente en Estado PENDIENTE**

**Qué significa:**
- El cliente está registrado pero **NO tiene suscripción activa**
- Está esperando que un **AUDITOR** o **ADMIN** realice la auditoría y firme el contrato
- Aparece en la lista de clientes pendientes

**Endpoints para ver clientes pendientes:**
- `GET /ops/clients/pending` - Lista clientes pendientes de auditoría
- `GET /ops/clients` - Lista todos los clientes (filtro por estado)

**Estado del Cliente:** `PENDIENTE`

---

### **PASO 3: Creación de Propiedad (Opcional pero Recomendado)**

**Endpoint:** `POST /ops/properties`

**Cuándo se hace:**
- Puede hacerse antes o durante el proceso de auditoría
- El auditor puede crear la propiedad cuando visita el domicilio

**Qué se crea:**
- Un registro `CustomerProperty` con:
  - Dirección, coordenadas GPS
  - Tipo de propiedad (DEPARTAMENTO, CASA, etc.)
  - Superficie, ambientes, baños
  - Estado: `PRE_ONBOARD` → `PRE_APPROVED` → `ACTIVE`

**Estado de la Propiedad:** `PRE_ONBOARD` o `PRE_APPROVED`

---

### **PASO 4: Creación del Contrato (BORRADOR)**

**Endpoint:** `POST /ops/contracts`

**Quién lo hace:** ADMIN o AUDITOR

**Qué se crea:**
- Un `Contract` en estado `BORRADOR`
- Se asigna:
  - `clientId` - Cliente que se va a suscribir
  - `propertyId` - Propiedad (opcional)
  - `planId` - Plan seleccionado
  - `ejecutivoId` - ID del auditor/admin que crea el contrato

**Estado del Contrato:** `BORRADOR`

---

### **PASO 5: Firma del Contrato (Proceso de Alta In-Situ)**

**Endpoint:** `POST /ops/contracts/:id/sign`

**Quién lo hace:** ADMIN o AUDITOR (típicamente el auditor en el domicilio del cliente)

**Qué sucede:**
1. Se completa la información del cliente (nombre, documento, etc.)
2. Se selecciona el plan definitivo
3. Se capturan las firmas digitales (cliente y empresa)
4. Se calculan las fechas de vigencia (24 meses típicamente)
5. Se actualiza el estado del contrato a `FIRMADO`
6. **Se crea o actualiza la SUSCRIPCIÓN:**
   - Si existe una suscripción en estado `REVISION`, se actualiza
   - Si no existe, se crea una nueva suscripción con estado `ACTIVE`
7. **Se activa el cliente:**
   - Estado del cliente cambia de `PENDIENTE` a `ACTIVO`
8. **Se activa la propiedad:**
   - Estado de la propiedad cambia a `ACTIVE`

**Código relevante:**
- `backend/services/operations-service/src/modules/contracts/contracts.service.ts` (método `signContract`, línea 65-244)

**Estados después de la firma:**
- Cliente: `ACTIVO`
- Contrato: `FIRMADO`
- Suscripción: `ACTIVE`
- Propiedad: `ACTIVE`

---

### **PASO 6: Suscripción Activa**

**Qué significa:**
- El cliente tiene una suscripción activa
- Puede solicitar órdenes de trabajo
- Se le factura mensualmente según el plan
- Tiene acceso completo a los servicios

**Endpoints relacionados:**
- `GET /ops/subscriptions/me` - Cliente ve su suscripción
- `GET /ops/subscriptions` - Admin/Operator listan suscripciones
- `PATCH /ops/subscriptions/:id/status` - Cambiar estado de suscripción

**Estados posibles de Suscripción:**
- `ACTIVE` - Activa y al día
- `REVISION` - Pendiente de revisión/auditoría
- `GRACE` - En período de gracia (3 días después del vencimiento)
- `PAST_DUE` - Vencida
- `SUSPENDED` - Suspendida
- `CANCELED` - Cancelada
- `PAUSED` - Pausada

---

## 📊 Modelos de Datos Involucrados

### 1. **User** (schema: `auth`)
- Email, password, nombre
- Roles: `CUSTOMER`, `ADMIN`, `OPERATOR`, etc.

### 2. **Client** (schema: `operations`)
- Vinculado a `User` mediante `userId`
- Estados: `PENDIENTE`, `ACTIVO`, `SUSPENDIDO`, `INACTIVO`
- Datos personales/empresariales

### 3. **CustomerProperty** (schema: `operations`)
- Propiedad del cliente
- Estados: `PRE_ONBOARD`, `PRE_APPROVED`, `ACTIVE`, `REJECTED`
- Datos de ubicación, tipo, superficie

### 4. **Contract** (schema: `operations`)
- Contrato digital
- Estados: `BORRADOR`, `PENDIENTE_FIRMA`, `FIRMADO`, `CANCELADO`
- Firmas digitales, fechas de vigencia

### 5. **Subscription** (schema: `operations`)
- Suscripción activa del cliente
- Vinculada a `Client`, `Plan`, `Property`, `Contract`
- Estados: `ACTIVE`, `REVISION`, `GRACE`, `PAST_DUE`, etc.

### 6. **Plan** (schema: `operations`)
- Plan de suscripción
- Precio, características, tipos de trabajo incluidos

---

## 🔗 Relaciones entre Modelos

```
User (auth)
  ↓ userId
Client (operations)
  ↓ clientId
  ├─→ CustomerProperty[]
  ├─→ Subscription[]
  └─→ Contract[]
  
Contract
  ├─→ clientId → Client
  ├─→ propertyId → CustomerProperty
  ├─→ planId → Plan
  └─→ subscriptionId → Subscription

Subscription
  ├─→ clientId → Client
  ├─→ userId → User (auth)
  ├─→ propertyId → CustomerProperty
  ├─→ planId → Plan
  └─→ contracts[] → Contract[]
```

---

## 🎯 Puntos Clave del Flujo

1. **El signup crea automáticamente el Client en estado PENDIENTE**
2. **El cliente NO puede activarse solo** - requiere auditoría
3. **El contrato es el documento central** que vincula todo
4. **La firma del contrato activa automáticamente:**
   - El cliente (PENDIENTE → ACTIVO)
   - La suscripción (se crea/actualiza a ACTIVE)
   - La propiedad (a ACTIVE)
5. **Una vez activa, la suscripción se gestiona independientemente**

---

## 📝 Notas Importantes

- **No hay un modelo "Solicitud" separado** - el flujo usa:
  - Cliente en estado `PENDIENTE` = solicitud pendiente
  - Contrato en estado `BORRADOR` = solicitud en proceso
- **El frontend de "Solicitudes" debería mostrar:**
  - Clientes con estado `PENDIENTE`
  - Contratos en estado `BORRADOR` o `PENDIENTE_FIRMA`
- **El proceso puede variar:**
  - Algunos clientes pueden tener propiedad antes del contrato
  - Algunos contratos pueden crearse sin propiedad inicial
  - La suscripción puede crearse directamente sin contrato (para casos especiales)

---

## 🚀 Próximos Pasos para Implementar "Solicitudes"

1. **Crear endpoint para listar solicitudes:**
   - Clientes `PENDIENTE`
   - Contratos `BORRADOR` o `PENDIENTE_FIRMA`
   - Combinar ambos en una vista unificada

2. **Crear vista de detalle de solicitud:**
   - Mostrar datos del cliente
   - Mostrar datos de la propiedad (si existe)
   - Mostrar estado del contrato (si existe)
   - Permitir acciones según el rol (AUDITOR, ADMIN)

3. **Implementar acciones:**
   - Crear contrato desde solicitud
   - Firmar contrato
   - Rechazar solicitud
   - Asignar auditor

