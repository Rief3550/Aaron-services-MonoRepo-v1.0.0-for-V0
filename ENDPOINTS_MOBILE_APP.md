# 📱 Endpoints para App Móvil

Este documento lista todos los endpoints que la aplicación móvil necesita para funcionar correctamente.

## 🔐 Autenticación

### Registro de Usuario
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "Password123!",
  "fullName": "Nombre Completo",
  "lat": -29.408660,
  "lng": -66.858431
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Login
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

### Verificar Email con Código
```http
POST /auth/verify
Content-Type: application/json

{
  "code": "123456",
  "email": "usuario@example.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "userId": "uuid",
    "email": "usuario@example.com",
    "isEmailVerified": true
  },
  "message": "Email verified successfully"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### Logout
```http
POST /auth/signout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "..."
}
```

---

## 👤 Perfil del Cliente

### Obtener Mi Perfil
```http
GET /ops/clients/me
Authorization: Bearer {accessToken}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "email": "usuario@example.com",
  "nombreCompleto": "Nombre Completo",
  "estado": "ACTIVO",
  "documento": "12345678",
  "telefono": "+543804123456",
  "direccionFacturacion": "Dirección completa"
}
```

---

## 🏠 Propiedades (Inmuebles)

### Obtener Mis Propiedades
```http
GET /ops/properties/me
Authorization: Bearer {accessToken}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "address": "Av. San Martín 1234",
    "lat": -29.408660,
    "lng": -66.858431,
    "tipoPropiedad": "DEPARTAMENTO",
    "ambientes": 3,
    "banos": 2,
    "status": "ACTIVE"
  }
]
```

### Solicitar Mudanza/Reubicación
```http
POST /ops/properties/me/relocation
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "newAddress": "Nueva dirección 123",
  "lat": -29.500000,
  "lng": -66.900000,
  "reason": "Motivo de la mudanza"
}
```

---

## 📦 Suscripciones

### Obtener Mi Suscripción
```http
GET /ops/subscriptions/me
Authorization: Bearer {accessToken}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "planId": "uuid",
  "plan": {
    "id": "uuid",
    "name": "Plan Departamento Básico",
    "price": 15000,
    "currency": "ARS"
  },
  "status": "ACTIVE",
  "property": {
    "id": "uuid",
    "address": "Av. San Martín 1234"
  },
  "currentPeriodStart": "2025-11-28T00:00:00Z",
  "currentPeriodEnd": "2025-12-28T00:00:00Z"
}
```

### Solicitar Cambio de Plan (Upgrade)
```http
POST /ops/subscriptions/me/upgrade-request
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "planId": "uuid-del-nuevo-plan",
  "reason": "Necesito más servicios"
}
```

---

## 🔧 Órdenes de Trabajo

### Obtener Mis Órdenes de Trabajo
```http
GET /ops/work-orders/me
Authorization: Bearer {accessToken}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "titulo": "Reparación de cañería",
    "serviceCategory": "plomería",
    "description": "Fuga de agua en cocina",
    "state": "PENDIENTE",
    "address": "Av. San Martín 1234",
    "createdAt": "2025-11-28T10:00:00Z"
  }
]
```

### Solicitar Nueva Orden de Trabajo (Normalizado Mobile/Web)
```http
POST /ops/work-orders/request
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "workTypeId": "uuid-del-tipo-trabajo",
  "serviceCategory": "plomería",
  "situacion": "Fuga de agua en la cocina, el agua está goteando constantemente",
  "peligroAccidente": "NO",
  "observaciones": "La fuga comenzó esta mañana, ya cerré la llave de paso",
  "prioridad": "MEDIA",
  "cantidadEstimada": 1,
  "unidadCantidad": "visita"
}
```

**Campos requeridos:**
- `serviceCategory` (string): Categoría del servicio (plomería|electricidad|gas|pintura|emergencia|etc.)
- `situacion` (string): Descripción de la situación actual del problema

**Campos opcionales:**
- `workTypeId` (UUID): ID del tipo de trabajo del catálogo
- `propertyId` (UUID): ID de la propiedad (si no se especifica, usa la primera activa)
- `peligroAccidente` (string): SI|NO|URGENTE - Indica si hay peligro o riesgo de accidente
- `observaciones` (string): Observaciones adicionales del cliente
- `description` (string): Descripción detallada (se combina con situación y observaciones)
- `prioridad` (string): **SOLO ADMIN/OPERATOR** - BAJA|MEDIA|ALTA|EMERGENCIA (para CUSTOMER se calcula automáticamente según peligroAccidente)
- `canal` (string): APP|WEB|TELEFONO|WHATSAPP (default: APP)
- `cantidadEstimada` (number): Cantidad estimada del trabajo
- `unidadCantidad` (string): m2|hora|visita|unidad

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Fuga de agua en la cocina",
    "serviceCategory": "plomería",
    "description": "Fuga de agua en la cocina, el agua está goteando constantemente\n\nLa fuga comenzó esta mañana, ya cerré la llave de paso",
    "notasCliente": "La fuga comenzó esta mañana, ya cerré la llave de paso",
    "state": "PENDIENTE",
    "prioridad": "MEDIA",
    "address": "Av. San Martín 1234",
    "lat": -29.408660,
    "lng": -66.858431,
    "createdAt": "2025-11-28T10:00:00Z",
    "workType": {
      "id": "uuid",
      "nombre": "Reparación de cañería"
    }
  }
}
```

**Notas importantes:**
- Este endpoint crea una orden de trabajo en estado `PENDIENTE`
- Si `peligroAccidente` es "URGENTE" o "SI", la prioridad se establece automáticamente como "EMERGENCIA"
- La `situacion` y `observaciones` se combinan en el campo `description`
- El sistema asignará un auditor/cuadrilla para procesar la orden
- Funciona tanto para app móvil (CUSTOMER) como para web del sistema (ADMIN/OPERATOR)

### Obtener Detalle de Orden
```http
GET /ops/work-orders/me/{orderId}
Authorization: Bearer {accessToken}
```

### Obtener Timeline de Orden
```http
GET /ops/work-orders/{orderId}/timeline
Authorization: Bearer {accessToken}
```

---

## 📋 Planes Disponibles

### Listar Planes Activos
```http
GET /ops/plans
Authorization: Bearer {accessToken}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Plan Departamento Básico",
    "description": "Plan básico para departamentos",
    "price": 15000,
    "currency": "ARS",
    "billingPeriod": "MONTHLY",
    "active": true,
    "caracteristicas": ["Plomería", "Electricidad", "Pintura"]
  }
]
```

---

## 🔔 Notificaciones (Futuro)

### Obtener Notificaciones
```http
GET /notifications/me
Authorization: Bearer {accessToken}
```

---

## 📊 Resumen de Endpoints Móviles

| Categoría | Método | Endpoint | Descripción |
|-----------|--------|----------|-------------|
| **Auth** | POST | `/auth/signup` | Registro de usuario |
| **Auth** | POST | `/auth/signin` | Login |
| **Auth** | POST | `/auth/verify` | Verificar email con código |
| **Auth** | POST | `/auth/refresh` | Refrescar token |
| **Auth** | POST | `/auth/signout` | Logout |
| **Cliente** | GET | `/ops/clients/me` | Obtener perfil del cliente |
| **Propiedades** | GET | `/ops/properties/me` | Listar mis propiedades |
| **Propiedades** | POST | `/ops/properties/me/relocation` | Solicitar mudanza |
| **Suscripciones** | GET | `/ops/subscriptions/me` | Obtener mi suscripción |
| **Suscripciones** | POST | `/ops/subscriptions/me/upgrade-request` | Solicitar cambio de plan |
| **Work Orders** | GET | `/ops/work-orders/me` | Listar mis órdenes |
| **Work Orders** | POST | `/ops/work-orders/request` | Crear nueva orden |
| **Work Orders** | GET | `/ops/work-orders/me/{id}` | Detalle de orden |
| **Work Orders** | GET | `/ops/work-orders/{id}/timeline` | Timeline de orden |

---

## 🔍 Endpoints que Faltan o Necesitan Verificación

1. **Listar Planes Disponibles** - ¿Existe endpoint público para planes?
2. **Notificaciones** - Sistema de notificaciones push
3. **Historial de Pagos** - Ver pagos realizados
4. **Actualizar Perfil** - Editar datos del cliente
5. **Cambiar Contraseña** - Desde la app

---

## 📝 Notas Importantes

- Todos los endpoints requieren `Authorization: Bearer {accessToken}` excepto signup, signin y verify
- El `accessToken` expira en 15 minutos
- Usar `refreshToken` para obtener nuevo `accessToken`
- Los endpoints con `/me` devuelven datos del usuario autenticado
- Las coordenadas (lat/lng) son requeridas en varios endpoints

