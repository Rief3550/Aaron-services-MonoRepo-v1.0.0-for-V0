# 🔄 Flujo Completo: Cliente desde Signup hasta ACTIVO

## 📋 Resumen del Flujo de Trabajo

Este documento describe el flujo completo desde que un cliente se registra en la app móvil hasta que queda activo y puede usar el sistema normalmente.

---

## 🚀 PASO 1: Registro del Cliente (Signup desde App Móvil)

### Acción del Cliente
El cliente se registra desde la **app móvil Flutter** usando:

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "Password123!",
  "fullName": "Nombre Cliente",
  "lat": -29.408660,
  "lng": -66.858431
}
```

### Lo que sucede automáticamente:

1. **Se crea User** en schema `auth`:
   - Email, password hash, nombre completo
   - Rol asignado: `CUSTOMER`
   - `isEmailVerified: false`

2. **Se envía email de verificación** al cliente

3. **Cuando el cliente verifica su email:**
   - Se crea automáticamente un **Client** en schema `operations`
   - Estado inicial: **`PENDIENTE`**
   - Aparece en el panel de **Solicitudes** del backoffice

**Estado Final del Cliente:** `PENDIENTE`

**Endpoint que lo crea:** `POST /auth/verify` (después de verificar email)

---

## ⏸️ PASO 2: Estado PENDIENTE - Esperando Procesamiento

### Qué significa PENDIENTE

- ✅ Cliente registrado y email verificado
- ✅ Aparece en panel de **Solicitudes** del backoffice
- ❌ **NO puede hacer nada aún** - el sistema lo bloquea
- ❌ No tiene suscripción activa
- ❌ No puede solicitar órdenes de trabajo
- ❌ Está esperando que un operador/admin complete el proceso

### Vista en Backoffice

El cliente aparece en:
- **Panel de Solicitudes** (`/solicitudes`)
- Lista de clientes pendientes: `GET /ops/clients/pending`
- Estado visible: **PENDIENTE** (badge amarillo)

**⚠️ IMPORTANTE:** Mientras está en `PENDIENTE`, **no se puede hacer nada** con el cliente hasta que el operador complete todos los pasos siguientes.

---

## 👨‍💼 PASO 3: Procesamiento por Operador/Admin

El operador debe completar **TODOS** estos pasos en orden:

### 3.1. Editar Datos del Cliente

**Endpoint:** `PATCH /ops/clients/:id`

**Campos editables:**
```json
{
  "nombreCompleto": "Nombre Completo",
  "telefono": "+543804123456",
  "telefonoAlt": "+543804123457",
  "documento": "12345678",
  "direccionFacturacion": "Dirección completa",
  "provincia": "La Rioja",
  "ciudad": "La Rioja",
  "codigoPostal": "5300"
}
```

**Acción:** Se guarda permanentemente en la base de datos ✅

---

### 3.2. Completar Datos del Inmueble (Propiedad)

**Endpoint:** `PUT /ops/properties/:id` (si ya existe) o `POST /ops/properties` (crear nueva)

**Campos editables:**
```json
{
  "address": "Dirección completa del inmueble",
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

**Acción:** Se guarda permanentemente en la base de datos ✅

---

### 3.3. Asignar Plan

**Endpoint para listar planes:** `GET /ops/plans`

**Qué hacer:**
1. Operador carga la lista de planes disponibles
2. Selecciona un plan del dropdown
3. El plan se guardará en la suscripción (paso siguiente)

**Acción:** Selección del plan (se guarda en suscripción) ✅

---

### 3.4. Crear Suscripción

**Endpoint:** `POST /ops/subscriptions`

**Cuándo crear:**
- Si el cliente NO tiene suscripción activa
- Después de haber seleccionado un plan

**Request:**
```json
{
  "userId": "uuid-del-usuario",
  "planId": "uuid-del-plan-seleccionado",
  "propertyId": "uuid-de-la-propiedad",
  "billingDay": 1
}
```

**Qué sucede:**
- Se crea la suscripción con estado `ACTIVE` o `REVISION`
- Se guarda permanentemente en la base de datos ✅
- Se vincula con la propiedad y el cliente

---

### 3.5. Completar Auditoría de Campo

**Endpoint:** `POST /ops/properties/:id/audit` (auditoría completa)

**O paso a paso:**
1. Asignar auditor: `POST /ops/clients/:id/assign-auditor`
2. Marcar como EN_PROCESO: `PATCH /ops/clients/:id/mark-in-process`
3. Capturar ubicación: `PUT /ops/properties/:id/location`
4. Completar checklist y notas

**Datos de auditoría:**
- Checklist de instalación (eléctrica, plomería, gas)
- Notas del auditor
- Fecha de visita
- Coordenadas GPS precisas

**Acción:** Se guarda permanentemente en la base de datos ✅

---

### 3.6. Revisar/Crear Contrato Digital

**Endpoint:** `POST /ops/contracts` o `POST /ops/contracts/:id/sign`

**Datos del contrato:**
- Plan seleccionado
- Fecha de inicio
- Términos y condiciones
- Firma digital del cliente (si aplica)

**Acción:** Se guarda permanentemente en la base de datos ✅

---

### 3.7. Activar el Cliente

**Endpoint:** `PATCH /ops/clients/:id/status`

**Request:**
```json
{
  "estado": "ACTIVO"
}
```

**⚠️ IMPORTANTE:** Solo se puede activar si:
- ✅ Tiene propiedad completa
- ✅ Tiene suscripción activa
- ✅ Tiene contrato (opcional pero recomendado)
- ✅ Auditoría completada

**Qué sucede al activar:**
1. Estado del cliente cambia: `PENDIENTE` → `ACTIVO`
2. **Se envía automáticamente email de bienvenida** 📧
3. El cliente ahora puede usar el sistema normalmente

**Acción:** Se guarda permanentemente en la base de datos ✅

---

## ✅ PASO 4: Estado ACTIVO - Cliente Operativo

### Qué significa ACTIVO

- ✅ Cliente completamente procesado
- ✅ Tiene suscripción activa
- ✅ Puede solicitar órdenes de trabajo
- ✅ Puede acceder a todos los servicios
- ✅ Email de bienvenida enviado

### Email de Bienvenida

**Se envía automáticamente cuando se activa:**
- **Asunto:** "¡Bienvenido a Aaron Services! Tu cuenta está activa"
- **Contenido:** Información del plan, servicios incluidos, contacto
- **Endpoint que lo envía:** `sendActivationEmail()` en `ClientEmailService`

**Código:** Se ejecuta en `activateClient()` cuando el estado cambia a `ACTIVO`

---

## 📝 Gestión de Datos - Todo es Editable

### Datos que se pueden editar permanentemente

#### Cliente
- ✅ Nombre completo
- ✅ Teléfono y teléfono alternativo
- ✅ Documento
- ✅ Dirección de facturación
- ✅ Provincia, ciudad, código postal
- ✅ Estado (con restricciones de transición)

**Endpoint:** `PATCH /ops/clients/:id`

#### Propiedad
- ✅ Dirección completa
- ✅ Coordenadas (lat/lng)
- ✅ Tipo de propiedad y construcción
- ✅ Ambientes, baños, superficies
- ✅ Observaciones

**Endpoint:** `PUT /ops/properties/:id`

#### Suscripción
- ✅ Cambiar plan (upgrade/downgrade)
- ✅ Actualizar estado
- ✅ Cambiar fecha de facturación

**Endpoints:**
- `PATCH /ops/subscriptions/:id/upgrade` - Cambiar plan
- `PATCH /ops/subscriptions/:id/status` - Actualizar estado

#### Contrato
- ✅ Actualizar términos
- ✅ Modificar fechas
- ✅ Re-firmar si es necesario

---

## 🔄 Estados del Cliente y Transiciones Válidas

### Estados Disponibles

1. **`PENDIENTE`** - Recién registrado, esperando procesamiento
2. **`EN_PROCESO`** - Auditoría asignada, en proceso de visita
3. **`ACTIVO`** - Cliente operativo, puede usar el sistema
4. **`SUSPENDIDO`** - Suspendido temporalmente (ej: falta de pago)
5. **`INACTIVO`** - Dado de baja definitivamente

### Transiciones Válidas

```
PENDIENTE → EN_PROCESO → ACTIVO
                ↓
            SUSPENDIDO
                ↓
            INACTIVO
```

**Restricciones:**
- Solo se puede activar desde `EN_PROCESO`
- No se puede retroceder desde `ACTIVO` a `PENDIENTE`
- `INACTIVO` es estado final (no se puede cambiar)

---

## 📧 Envío de Email de Activación

### Cuándo se envía

El email se envía automáticamente cuando:
- El estado del cliente cambia a `ACTIVO`
- Se llama a `PATCH /ops/clients/:id/status` con `estado: "ACTIVO"`

### Dónde está implementado

**Archivo:** `backend/services/operations-service/src/modules/clients/clients.service.ts`

**Método:** `activateClient()` (línea 474)

**Código:**
```typescript
// Después de actualizar el estado a ACTIVO
await this.emailService.sendActivationEmail(
  client.email,
  client.nombreCompleto || 'Cliente',
  plan?.name // Nombre del plan si está disponible
);
```

### Contenido del Email

- Logo de Aaron Services
- Mensaje de bienvenida personalizado
- Información del plan asignado
- Servicios incluidos
- Instrucciones de uso
- Contacto de soporte

---

## 🎯 Checklist de Procesamiento

Para activar un cliente correctamente, el operador debe completar:

- [ ] **Datos del Cliente** completos y verificados
- [ ] **Propiedad** creada/actualizada con todos los datos
- [ ] **Plan** seleccionado de la lista disponible
- [ ] **Suscripción** creada y vinculada al plan
- [ ] **Auditoría** completada (checklist y notas)
- [ ] **Contrato** revisado/creado (si aplica)
- [ ] **Estado** cambiado a `ACTIVO`
- [ ] **Email de bienvenida** enviado automáticamente ✅

---

## 🔒 Restricciones mientras está PENDIENTE

### Lo que NO puede hacer el cliente en estado PENDIENTE:

- ❌ Solicitar órdenes de trabajo
- ❌ Acceder a servicios del plan
- ❌ Ver su suscripción
- ❌ Actualizar su perfil (bloqueado por estado)
- ❌ Cualquier acción que requiera cliente activo

### Validaciones en el Backend:

El sistema verifica que el cliente esté `ACTIVO` antes de permitir:
- Crear órdenes de trabajo
- Acceder a servicios premium
- Usar funcionalidades de suscripción

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTE SE REGISTRA EN APP MÓVIL                       │
│  POST /auth/signup                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  VERIFICA EMAIL                                         │
│  POST /auth/verify                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CLIENTE CREADO CON ESTADO: PENDIENTE                   │
│  Aparece en panel de Solicitudes                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  OPERADOR PROCESA (en orden):                           │
│  1. Edita datos del cliente                             │
│  2. Completa datos del inmueble                         │
│  3. Selecciona plan                                     │
│  4. Crea suscripción                                    │
│  5. Completa auditoría                                  │
│  6. Revisa/crea contrato                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  OPERADOR ACTIVA EL CLIENTE                             │
│  PATCH /ops/clients/:id/status {estado: "ACTIVO"}       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  SISTEMA ENVÍA EMAIL DE BIENVENIDA                      │
│  Automáticamente al cambiar a ACTIVO                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CLIENTE ESTÁ ACTIVO                                    │
│  Puede usar el sistema normalmente                      │
│  Puede solicitar órdenes de trabajo                     │
│  Puede acceder a todos los servicios                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Endpoints Involucrados

### Autenticación
- `POST /auth/signup` - Registro inicial
- `POST /auth/verify` - Verificar email (crea cliente)

### Gestión de Cliente
- `GET /ops/clients/pending` - Listar pendientes
- `GET /ops/clients/:id` - Ver detalle completo
- `PATCH /ops/clients/:id` - Editar datos del cliente
- `PATCH /ops/clients/:id/status` - Cambiar estado (activar)

### Gestión de Propiedad
- `GET /ops/properties/:id` - Ver propiedad
- `PUT /ops/properties/:id` - Actualizar propiedad
- `POST /ops/properties` - Crear nueva propiedad
- `POST /ops/properties/:id/audit` - Completar auditoría

### Gestión de Planes
- `GET /ops/plans` - Listar planes disponibles

### Gestión de Suscripción
- `POST /ops/subscriptions` - Crear suscripción
- `GET /ops/subscriptions` - Listar suscripciones
- `PATCH /ops/subscriptions/:id/upgrade` - Cambiar plan

### Auditoría
- `POST /ops/clients/:id/assign-auditor` - Asignar auditor
- `PATCH /ops/clients/:id/mark-in-process` - Marcar en proceso

### Contrato
- `POST /ops/contracts` - Crear contrato
- `POST /ops/contracts/:id/sign` - Firmar contrato

---

## ⚠️ Validaciones Importantes

### Antes de Activar

El sistema debe verificar que:
1. ✅ Cliente tiene datos completos (nombre, teléfono, documento)
2. ✅ Cliente tiene al menos una propiedad
3. ✅ Propiedad tiene datos completos (dirección, coordenadas)
4. ✅ Cliente tiene una suscripción activa
5. ✅ Suscripción está vinculada a un plan válido

### Validación de Estado

```typescript
// Solo se puede activar desde EN_PROCESO
if (client.estado !== EstadoCliente.EN_PROCESO) {
  throw new ConflictException('Solo se pueden activar clientes en estado EN_PROCESO');
}
```

---

## 📝 Notas para Desarrollo

1. **Persistencia:** Todos los datos se guardan permanentemente en PostgreSQL
2. **Editabilidad:** Todos los campos son editables (excepto estado que tiene restricciones)
3. **Email automático:** Se envía cuando el estado cambia a `ACTIVO`
4. **Validaciones:** El backend valida que se cumplan todos los requisitos antes de activar
5. **Auditoría:** Se puede completar en un solo paso o paso a paso
6. **Contrato:** Es opcional pero recomendado para activación completa

---

## 🔄 Casos Especiales

### Cliente sin Email Verificado

Si el cliente se registra pero no verifica su email:
- No se crea el `Client` en operations-service
- Aparece solo como `User` en auth-service
- No aparece en solicitudes hasta que verifique

### Cliente Manual (sin signup)

Si un admin crea un cliente manualmente:
- Se puede crear con `POST /ops/clients/manual`
- Se crea directamente con estado `ACTIVO` (bypass del flujo)
- Se envía email de bienvenida automáticamente

### Re-activación

Si un cliente `SUSPENDIDO` necesita reactivarse:
- `PATCH /ops/clients/:id/status` con `estado: "ACTIVO"`
- No se envía email de bienvenida (solo en primera activación)

---

**Última actualización**: 2025-12-02
**Versión**: 1.0.0




