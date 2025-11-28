# Estructura Modular del Monorepo

Este documento describe la estructura modular de cada servicio en el monorepo.

## API Gateway (NestJS)

### GatewayModule
**Ubicación**: `apps/api-gateway/src/modules/gateway/gateway.module.ts`

- Reverse proxy a servicios backend
- JWT guard global antes de enrutar
- Proxy `/auth/*` → AUTH_URL
- Proxy `/ops/*` → OPS_URL

### HealthModule
**Ubicación**: `apps/api-gateway/src/modules/health/health.module.ts`

- Endpoint de health check local (`GET /health`)
- No se proxea

---

## Auth Service (Express con módulos)

### AuthModule
**Ubicación**: `apps/auth-service/src/modules/auth/auth.module.ts`

Módulo de autenticación (local/passport/google/jwt):
- **AuthController**: signup, signin, signout, refresh
- **GoogleOAuthService**: Passport Google strategy
- **JwtService**: Token generation/validation
- **AuthService**: Business logic
- **EmailService**: Envío de emails de verificación

**Rutas**: `/auth/*`

### UsersModule
**Ubicación**: `apps/auth-service/src/modules/users/users.module.ts`

Módulo CRUD de usuarios:
- **UserController**: CRUD operations
- **UserService**: Business logic

**Rutas**: `/users/*`

### RolesModule
**Ubicación**: `apps/auth-service/src/modules/roles/roles.module.ts`

Módulo de gestión de roles (RBAC):
- **RoleController**: CRUD operations
- **RoleService**: Business logic

**Rutas**: `/roles/*`

### MailModule
**Ubicación**: `apps/auth-service/src/modules/mail/mail.module.ts`

Módulo de envío de emails (Resend wrapper):
- **EmailService**: Resend integration
- **MailService**: Wrapper de `@aaron/mail`
- Email templates (verify-email, reset-password)

**Uso**: Interno, usado por AuthModule

### AuditModule
**Ubicación**: `apps/auth-service/src/modules/audit/audit.module.ts`

Módulo de auditoría (EmailAudit):
- **EmailAudit logging**: Integrado en EmailService
- Future: Session audit, action audit, etc.

**Uso**: Interno, usado por EmailService

---

## Operations Service (Express con módulos)

### PlansModule
**Ubicación**: `apps/operations-service/src/modules/plans/plans.module.ts`

Módulo de gestión de planes:
- **PlanController**: CRUD operations
- **PlanService**: Business logic

**Rutas**: `/plans/*`

### SubscriptionsModule
**Ubicación**: `apps/operations-service/src/modules/subscriptions/subscriptions.module.ts`

Módulo de gestión de suscripciones:
- **SubscriptionController**: CRUD operations
- **SubscriptionService**: Business logic

**Rutas**: `/subscriptions/*`

### PaymentsModule
**Ubicación**: `apps/operations-service/src/modules/payments/payments.module.ts`

Módulo de pagos (dummy):
- **Status**: Placeholder
- **TODO**: Integrar con proveedor real (Stripe, PayPal, etc.)

**Rutas**: `/payments/*` (no implementado aún)

### WorkOrdersModule
**Ubicación**: `apps/operations-service/src/modules/work-orders/work-orders.module.ts`

Módulo de órdenes de trabajo (timeline + states):
- **WorkOrderController**: CRUD + state transitions
- **WorkOrderService**: Business logic + state machine
- Timeline analyzer utilities
- State transition validation

**Rutas**: `/work-orders/*`

### CrewsModule
**Ubicación**: `apps/operations-service/src/modules/crews/crews.module.ts`

Módulo de gestión de cuadrillas:
- **CrewController**: CRUD operations
- **CrewService**: Business logic

**Rutas**: `/crews/*`

### MetricsModule
**Ubicación**: `apps/operations-service/src/modules/metrics/metrics.module.ts`

Módulo de métricas y análisis:
- **Status**: Placeholder
- **TODO**: Implementar endpoints de métricas
  - Productividad de cuadrillas
  - Tiempo promedio de órdenes
  - Revenue por período
  - Estadísticas de estados

**Rutas**: `/metrics/*` (no implementado aún)

### EventsModule
**Ubicación**: `apps/operations-service/src/modules/events/events.module.ts`

Módulo de eventos (pub/sub con Redis):
- **TrackingEvent publisher**: `publishWorkOrderEnCamino`
- **Redis client**: Setup y configuración
- Inicializa Redis cuando el módulo se carga

**Uso**: Interno, usado por WorkOrdersModule

---

## Tracking Service (Express con módulos)

### WsModule
**Ubicación**: `apps/tracking-service/src/modules/ws/ws.module.ts`

Módulo WebSocket (Gateway, rooms order:/crew:):
- **WebSocket handler**: `handler.ts` - Maneja conexiones WebSocket
- **Room manager**: `rooms.ts` - Gestión de salas y clientes
- **Routes**: `/ws/track`

**Características**:
- Autenticación JWT desde query string
- Rooms: `order:{id}`, `crew:{id}`
- Broadcast de ubicaciones en tiempo real

### PingModule
**Ubicación**: `apps/tracking-service/src/modules/ping/ping.module.ts`

Módulo REST para ping horario:
- **TrackingController**: `POST /track/ping`
- **TrackingService.savePing**: Guarda ping con `source: hourly_api`

**Rutas**: `/track/ping`

### RoutesModule
**Ubicación**: `apps/tracking-service/src/modules/routes/routes.module.ts`

Módulo de consulta de rutas/summary:
- **TrackingController.getRoute**: `GET /track/route`
- **TrackingService.getRoute**: Historial con cálculo de distancia
- **RouteSummary queries**: Consultas de resúmenes de rutas

**Rutas**: `/track/route`

### EventsModule
**Ubicación**: `apps/tracking-service/src/modules/events/events.module.ts`

Módulo de suscripción a eventos Redis:
- **Redis subscriber**: `initEventSubscriber`
- **Event handlers**: `handleWorkOrderEnCamino`
- Escucha canal `work_order_events` (configurable)

**Uso**: Inicializa Redis subscriber cuando el módulo se carga

---

## Estructura de Módulos

### Para API Gateway (NestJS)

Los módulos son clases NestJS con decorador `@Module()`:

```typescript
@Module({
  imports: [...],
  controllers: [...],
  providers: [...],
})
export class GatewayModule {}
```

### Para Servicios Express

Los módulos son objetos TypeScript que agrupan controllers, services y routes:

```typescript
export const AuthModule = {
  controllers: [AuthController],
  services: [AuthService, JwtService],
  routes: authRoutes,
  path: '/auth',
};
```

**Uso en main.ts**:
```typescript
import { AuthModule, UsersModule } from './modules';

app.use(AuthModule.path, AuthModule.routes);
app.use(UsersModule.path, UsersModule.routes);
```

---

## Ventajas de la Estructura Modular

1. **Organización clara**: Cada módulo tiene su propósito específico
2. **Separación de responsabilidades**: Controllers, services y routes agrupados
3. **Facilita migración a NestJS**: Estructura similar facilita futura migración
4. **Reutilización**: Módulos pueden compartirse o duplicarse fácilmente
5. **Mantenibilidad**: Cambios en un módulo no afectan otros directamente

---

## Próximos Pasos

1. **Convertir a NestJS** (opcional): Migrar servicios Express a NestJS usando la misma estructura modular
2. **Implementar módulos faltantes**: PaymentsModule, MetricsModule
3. **Agregar más módulos según necesidad**: AuditModule extendido, NotificationsModule, etc.

