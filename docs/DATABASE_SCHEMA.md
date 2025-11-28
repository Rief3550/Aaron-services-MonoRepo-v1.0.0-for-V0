# Database Schema Overview

Este monorepo usa **una sola base PostgreSQL (`postgres`)** con **tres schemas lógicos** (auth, operations y tracking). Cada microservicio gestiona únicamente las tablas de su schema.

## Schema `auth` (Auth Service)
| Tabla | Campos clave | Descripción / relaciones |
| --- | --- | --- |
| `users` | `id`, `email`, `passwordHash`, `fullName`, `isEmailVerified` | Usuarios finales (admins, operadores, crews, clientes). Se relaciona a `roles`, `sessions` y `email_audit`. |
| `roles` | `id`, `name`, `description` | Catálogo de roles (ADMIN, OPERATOR, CREW, CUSTOMER, etc.). Relación N:M con `users` (`UserRoles`). |
| `sessions` | `id`, `userId`, `refreshToken`, `ip`, `userAgent`, `expiresAt` | Guarda tokens de refresco activos por usuario/dispositivo. FK a `users`. |
| `email_audit` | `id`, `userId`, `email`, `type (VERIFY/RESET/…)`, `status`, `meta` | Registro de correos enviados (verificación, reset). FK opcional a `users`. |

## Schema `operations` (Operations Service)
| Tabla | Campos clave | Descripción / relaciones |
| --- | --- | --- |
| `plans` | `id`, `name`, `price`, `currency`, `active` | Planes/combinaciones comerciales. Relación con `subscriptions` y `price_history`. |
| `price_history` | `id`, `planId`, `price`, `from`, `to` | Histórico de precios por plan. FK a `plans`. |
| `subscriptions` | `id`, `userId`, `planId`, `status`, `nextCharge`, `daysLeft`, `meta` | Suscripciones activas. FK a `plans`. |
| `crews` | `id`, `name`, `members (Json)`, `state`, `progress` | Cuadrillas de trabajo. Relación con `work_orders`. |
| `work_orders` | `id`, `customerId`, `address`, `location`, `type`, `description`, `state`, `crewId` | Órdenes de trabajo. FKs a `crews`. |
| `work_order_events` | `id`, `workOrderId`, `at`, `type`, `note`, `meta` | Timeline de cambios de estado para cada orden. FK a `work_orders`. |
| `metrics` | `id`, `name`, `category`, `value`, `unit`, `metadata`, `recordedAt` | Tablero de métricas/indicadores operativos. |
| `payments` | `id`, `subscriptionId`, `amount`, `currency`, `provider`, `intentId`, `status`, `metadata` | Registro de intents/resultados de pago (Stripe o mock). |

### Flujo principal
1. Un usuario compra un `plan` → crea `subscription`.
2. Se asignan `work_orders` a `crews` y se registran transiciones en `work_order_events`.
3. `payments` guarda intents Stripe/mocks.
4. `metrics`/`price_history` facilitan reporting.

## Schema `tracking` (Tracking Service)
| Tabla | Campos clave | Descripción / relaciones |
| --- | --- | --- |
| `crew_pings` | `id`, `crewId`, `orderId`, `lat`, `lng`, `source`, `at` | Pings de ubicación en tiempo real o por API. |
| `route_summaries` | `id`, `crewId`, `orderId`, `from`, `to`, `distanceKm`, `meta` | Rutas agregadas (diarias) basadas en los pings. Posee unique `(crewId, orderId, from)` para evitar duplicados. |

### Integración con otros servicios
- **Events:** Operations publica eventos `ORDER_EN_CAMINO`, `ORDER_STATUS` y `LOCATION_UPDATE` en Redis. Tracking los consume, guarda pings y retransmite por WebSocket.
- **Autenticación:** Los servicios confían en `auth` via JWT emitido por auth-service. Los guards locales validan `roles`/`crewId` para determinar permisos.

## Notas de conexión
- Todas las apps usan `DATABASE_URL` con cronograma: `postgresql://<user>:<password>@localhost:5432/postgres?schema=<schema>`.
- Si se crea un nuevo microservicio con schema propio, basta con agregarlo a la configuración multi-schema de Prisma (`schemas = ["nuevo_schema"]`) y generar migraciones.
