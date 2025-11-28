# API Endpoints Inventory

## Base URL
`http://localhost:3000`

## 🔐 Auth Service
**Prefix**: `/auth`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/auth/signup` | Register a new user | Public |
| POST | `/auth/signin` | Login with email/password | Public |
| POST | `/auth/signout` | Logout (invalidate refresh token) | Authenticated |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/forgot-password` | Request password reset email | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |
| POST | `/auth/verify` | Verify email address | Public |
| GET | `/auth/google` | Initiate Google OAuth | Public |
| GET | `/auth/google/callback` | Google OAuth callback | Public |

### Users Management
**Prefix**: `/users`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/users/me` | Get current user profile | Authenticated |
| POST | `/users` | Create a user manually | ADMIN |
| GET | `/users` | List all users | ADMIN |
| GET | `/users/:id` | Get user details | ADMIN |
| PUT | `/users/:id` | Update user | ADMIN |
| DELETE | `/users/:id` | Delete user | ADMIN |

### Roles Management
**Prefix**: `/roles`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/roles` | Create a new role | ADMIN |
| GET | `/roles` | List all roles | Authenticated |
| GET | `/roles/:id` | Get role details | Authenticated |
| PUT | `/roles/:id` | Update role | ADMIN |
| DELETE | `/roles/:id` | Delete role | ADMIN |
| POST | `/roles/:userId/assign` | Assign roles to user | ADMIN |
| POST | `/roles/:userId/remove` | Remove roles from user | ADMIN |

---

## ⚙️ Operations Service
**Prefix**: `/ops`

### 👤 Clients
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/clients/me` | Get my client profile (App móvil) | CUSTOMER, ADMIN |
| GET | `/ops/clients` | List all clients | ADMIN, OPERATOR |
| GET | `/ops/clients/pending` | List clients pending audit | ADMIN, OPERATOR, AUDITOR |
| GET | `/ops/clients/:id` | Get client details | ADMIN, OPERATOR, AUDITOR |
| PATCH | `/ops/clients/:id` | Update client data | ADMIN, AUDITOR |
| PATCH | `/ops/clients/:id/status` | Update client status | ADMIN |
| PATCH | `/ops/clients/:id/activate` | Activate client after audit | ADMIN, AUDITOR |
| POST | `/ops/clients/internal/create` | Internal: Create client from signup | Internal |

### 📋 Plans (CRUD Completo)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/plans` | List subscription plans (active only) | ADMIN, OPERATOR |
| GET | `/ops/plans/:id/price-history` | Get plan price history | ADMIN, OPERATOR |
| GET | `/ops/admin/plans` | List ALL plans (including inactive) | ADMIN |
| GET | `/ops/admin/plans/:id` | Get plan by ID with details | ADMIN |
| POST | `/ops/admin/plans` | Create a new plan | ADMIN |
| PUT | `/ops/admin/plans/:id` | Update a plan | ADMIN |
| DELETE | `/ops/admin/plans/:id` | Delete a plan | ADMIN |

### 📦 Subscriptions (CRUD Completo)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/subscriptions/me` | Get my subscription (App móvil) | CUSTOMER, ADMIN |
| POST | `/ops/subscriptions/me/upgrade-request` | Request plan change (App móvil) | CUSTOMER |
| GET | `/ops/subscriptions` | List subscriptions | ADMIN, OPERATOR |
| POST | `/ops/subscriptions` | Create subscription | ADMIN |
| PATCH | `/ops/subscriptions/:id/upgrade` | Upgrade subscription plan | ADMIN |
| PATCH | `/ops/subscriptions/:id/cancel` | Cancel subscription | ADMIN |
| PATCH | `/ops/subscriptions/:id/charge` | Trigger charge | ADMIN |
| POST | `/ops/subscriptions/:id/payments/manual` | Record manual payment | ADMIN, OPERATOR |
| PATCH | `/ops/subscriptions/:id/status` | Update subscription status | ADMIN |
| GET | `/ops/admin/subscriptions` | List ALL subscriptions | ADMIN |
| POST | `/ops/admin/subscriptions` | Admin create subscription | ADMIN |
| PUT | `/ops/admin/subscriptions/:id` | Admin update subscription | ADMIN |
| PATCH | `/ops/admin/subscriptions/:id/estado` | Admin change status | ADMIN |

### 🔧 Work Types / Tipos de Trabajo (CRUD Completo)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/work-types` | List active work types (App/Frontend) | CUSTOMER, ADMIN, OPERATOR |
| GET | `/ops/admin/work-types` | List ALL work types | ADMIN |
| GET | `/ops/admin/work-types/:id` | Get work type by ID | ADMIN |
| POST | `/ops/admin/work-types` | Create work type | ADMIN |
| PUT | `/ops/admin/work-types/:id` | Update work type | ADMIN |
| DELETE | `/ops/admin/work-types/:id` | Delete work type | ADMIN |

### 📝 Work Orders (Órdenes de Trabajo)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/work-orders/me` | Get my orders (App móvil) | CUSTOMER, ADMIN |
| POST | `/ops/work-orders/request` | Request new work order (App móvil) | CUSTOMER |
| GET | `/ops/work-orders/me/:id` | Get my order detail (App móvil) | CUSTOMER, ADMIN |
| GET | `/ops/work-orders` | List work orders | ADMIN, OPERATOR |
| GET | `/ops/work-orders/map` | Get orders for map display | ADMIN, OPERATOR |
| GET | `/ops/work-orders/:id` | Get work order by ID | ADMIN, OPERATOR |
| POST | `/ops/work-orders` | Create work order | ADMIN |
| PATCH | `/ops/work-orders/:id` | Update work order | ADMIN |
| PATCH | `/ops/work-orders/:id/state` | Change work order state | ADMIN, OPERATOR |
| PATCH | `/ops/work-orders/:id/assign-crew/:crewId` | Assign crew | ADMIN, OPERATOR |
| PATCH | `/ops/work-orders/:id/progress` | Update progress | ADMIN, OPERATOR |
| GET | `/ops/work-orders/:id/timeline` | Get timeline events | ADMIN, OPERATOR |
| POST | `/ops/work-orders/:id/location` | Push location update | ADMIN, OPERATOR |

**WorkOrder campos cantidad/unidades:**
- `workTypeId`: UUID del tipo de trabajo
- `cantidad`: Cantidad (ej: 50 m², 3 horas)
- `unidadCantidad`: "m2" | "hora" | "visita" | "unidad"
- `tiempoEstimadoHoras`: Tiempo estimado
- `tiempoRealHoras`: Tiempo real trabajado
- `costoEstimado`: Costo estimado
- `costoFinal`: Costo final

### 👷 Crews (Cuadrillas)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/crews/me` | Get my crew (Mobile App) | CREW, OPERATOR, ADMIN |
| GET | `/ops/crews` | List crews | ADMIN, OPERATOR |
| GET | `/ops/admin/crews` | List ALL crews | ADMIN |
| GET | `/ops/admin/crews/:id` | Get crew by ID | ADMIN |
| POST | `/ops/admin/crews` | Create crew | ADMIN |
| PUT | `/ops/admin/crews/:id` | Update crew | ADMIN |
| DELETE | `/ops/admin/crews/:id` | Delete crew | ADMIN |
| PATCH | `/ops/crews/:id/state` | Change crew state | ADMIN, OPERATOR |
| PATCH | `/ops/crews/:id/progress` | Update crew progress | ADMIN, OPERATOR |

### 🏠 Properties (Inmuebles) - CRUD Completo
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/properties/me` | Get my properties (App móvil) | CUSTOMER, ADMIN |
| POST | `/ops/properties/me/relocation` | Request relocation/mudanza (App móvil) | CUSTOMER |
| GET | `/ops/properties` | List properties | ADMIN, OPERATOR |
| GET | `/ops/properties/pending-audit` | List properties pending audit | ADMIN, OPERATOR, AUDITOR |
| GET | `/ops/properties/:id` | Get property by ID | ADMIN, OPERATOR, AUDITOR |
| POST | `/ops/properties` | Create property | ADMIN, AUDITOR |
| PUT | `/ops/properties/:id` | Update property | ADMIN, AUDITOR |
| PATCH | `/ops/properties/:id/status` | Update property status | ADMIN, AUDITOR |
| POST | `/ops/properties/:id/pre-approvals` | Create pre-approval | ADMIN, AUDITOR |
| PUT | `/ops/properties/:id/location` | Capture precise GPS location | ADMIN, AUDITOR |
| POST | `/ops/properties/:id/audit` | Complete in-situ audit | ADMIN, AUDITOR |

### 📝 Contracts (Contrato Digitalizado)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/ops/contracts` | Create new contract (BORRADOR) | ADMIN, AUDITOR |
| POST | `/ops/contracts/:id/sign` | Sign contract (complete process) | ADMIN, AUDITOR |
| GET | `/ops/contracts` | List all contracts | ADMIN, OPERATOR |
| GET | `/ops/contracts/:id` | Get contract by ID | ADMIN, OPERATOR, AUDITOR |
| GET | `/ops/contracts/client/:clientId` | Get contracts by client | ADMIN, OPERATOR, AUDITOR, CUSTOMER |
| PATCH | `/ops/contracts/:id/status` | Update contract status | ADMIN |

### 💳 Payments
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/ops/payments/intent` | Create payment intent | ADMIN, OPERATOR |
| POST | `/ops/payments/process` | Process payment | ADMIN, OPERATOR |
| POST | `/ops/payments/manual` | Record manual payment | ADMIN, OPERATOR |

### 📊 Metrics
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ops/metrics/overview` | Get system overview metrics | ADMIN, OPERATOR |

---

## 📍 Tracking Service
**Prefix**: `/track`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/track/ping` | Send location ping | Authenticated (Crew/Admin) |
| GET | `/track/route` | Get route history | Authenticated |
| GET | `/track/summary` | Get route summary | Authenticated |

## 📡 WebSocket
**URL**: `ws://localhost:3003/ws/track`
**Events**:
- `subscribe`: Subscribe to tracking updates
- `unsubscribe`: Unsubscribe
- `location_update`: Receive real-time location updates

---

## 📱 Frontend Pages (Admin)

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | Vista general con mapa y KPIs |
| Órdenes | `/ordenes` | Gestión de órdenes de trabajo |
| Clientes | `/clientes` | Lista y gestión de clientes |
| Clientes Detalle | `/clientes/:id` | Ficha completa del cliente |
| Planes | `/admin/planes` | CRUD de planes de suscripción |
| Tipos de Trabajo | `/admin/tipos-trabajo` | CRUD de tipos de trabajo |
| Usuarios | `/admin/usuarios` | CRUD de usuarios del sistema |
| Suscripciones | `/admin/suscripciones` | Gestión de suscripciones |
| Cuadrillas | `/admin/cuadrillas` | CRUD de cuadrillas |

---

## Estados de Órdenes de Trabajo

| Estado | Descripción | Mutable |
|--------|-------------|---------|
| `PENDIENTE` | Estado inicial | ✅ |
| `ASIGNADA` | Cuadrilla asignada | ✅ |
| `EN_PROGRESO` | Trabajo en curso | ✅ |
| `FINALIZADA` | Completado | ❌ |
| `CANCELADA` | Cancelado | ❌ |

## Estados de Cliente

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE` | Recién registrado, esperando auditoría |
| `ACTIVO` | Auditoría aprobada, cliente operativo |
| `SUSPENDIDO` | Suspendido por falta de pago |
| `INACTIVO` | Dado de baja |
