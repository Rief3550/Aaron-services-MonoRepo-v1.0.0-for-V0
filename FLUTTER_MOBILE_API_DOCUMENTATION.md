# 📱 Documentación API para App Móvil Flutter - Aaron Services

## 🔧 Configuración Base

### Base URL
```
Desarrollo: http://localhost:3100
Producción: [Configurar según deployment]
```

### Headers Requeridos
```dart
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {accessToken}' // Para endpoints protegidos
}
```

### Estructura de Respuesta Estándar
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

### Estructura de Error
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error"
  }
}
```

---

## 🔐 AUTENTICACIÓN (Endpoints Públicos)

### 1. Registro de Usuario (Sign Up)
```http
POST /auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123!",
  "fullName": "Nombre Completo",
  "lat": -29.408660,
  "lng": -66.858431
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "fullName": "Nombre Completo",
      "isEmailVerified": false,
      "roles": ["CUSTOMER"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Notas:**
- Crea automáticamente un cliente en el sistema
- El usuario recibe rol `CUSTOMER` por defecto
- `accessToken` expira en 15 minutos
- `refreshToken` expira en 7 días

---

### 2. Inicio de Sesión (Sign In)
```http
POST /auth/signin
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "fullName": "Nombre Completo",
      "isEmailVerified": true,
      "roles": ["CUSTOMER"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Notas:**
- Guarda `accessToken` y `refreshToken` en almacenamiento seguro
- Usa `accessToken` en el header `Authorization` para requests protegidos

---

### 3. Cerrar Sesión (Sign Out)
```http
POST /auth/signout
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

---

### 4. Refrescar Token
```http
POST /auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "nuevo_token...",
    "refreshToken": "nuevo_refresh_token..."
  }
}
```

**Notas:**
- Llamar automáticamente cuando `accessToken` expire (401)
- Actualizar ambos tokens en almacenamiento

---

### 5. Recuperar Contraseña (Forgot Password)
```http
POST /auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

---

### 6. Restablecer Contraseña (Reset Password)
```http
POST /auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "token_recibido_por_email",
  "password": "NuevaPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 7. Verificar Email
```http
POST /auth/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

**Response (200):**
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

---

## 👤 ENDPOINTS PARA CLIENTES (Role: CUSTOMER)

### 1. Obtener Mi Perfil
```http
GET /ops/clients/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "email": "usuario@example.com",
  "nombreCompleto": "Nombre Completo",
  "estado": "ACTIVO",
  "documento": "12345678",
  "telefono": "+543804123456",
  "direccionFacturacion": "Dirección completa",
  "lat": -29.408660,
  "lng": -66.858431,
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 2. Actualizar Mi Perfil
```http
PATCH /ops/clients/:id
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nombreCompleto": "Nuevo Nombre",
  "telefono": "+543804123456",
  "direccionFacturacion": "Nueva dirección",
  "lat": -29.408660,
  "lng": -66.858431
}
```

---

### 3. Obtener Mis Propiedades
```http
GET /ops/properties/me
Authorization: Bearer {accessToken}
```

**Response (200):**
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
    "status": "ACTIVE",
    "createdAt": "2025-11-28T10:00:00Z"
  }
]
```

---

### 4. Solicitar Mudanza/Reubicación
```http
POST /ops/properties/me/relocation
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "newAddress": "Nueva dirección 123",
  "lat": -29.500000,
  "lng": -66.900000,
  "reason": "Motivo de la mudanza"
}
```

---

### 5. Obtener Mi Suscripción
```http
GET /ops/subscriptions/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "planId": "uuid",
  "plan": {
    "id": "uuid",
    "name": "Plan Departamento Básico",
    "price": 15000,
    "currency": "ARS",
    "billingPeriod": "MONTHLY"
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

---

### 6. Solicitar Cambio de Plan (Upgrade)
```http
POST /ops/subscriptions/me/upgrade-request
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "uuid-del-nuevo-plan",
  "reason": "Necesito más servicios"
}
```

---

### 7. Obtener Mis Órdenes de Trabajo
```http
GET /ops/work-orders/me
Authorization: Bearer {accessToken}
```

**Query Parameters (opcionales):**
- `state`: PENDIENTE|ASIGNADA|EN_PROGRESO|FINALIZADA|CANCELADA
- `skip`: número (paginación)
- `take`: número (límite)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "titulo": "Reparación de cañería",
    "serviceCategory": "plomería",
    "description": "Fuga de agua en cocina",
    "state": "PENDIENTE",
    "prioridad": "MEDIA",
    "address": "Av. San Martín 1234",
    "lat": -29.408660,
    "lng": -66.858431,
    "createdAt": "2025-11-28T10:00:00Z",
    "workType": {
      "id": "uuid",
      "nombre": "Reparación de cañería"
    },
    "crew": {
      "id": "uuid",
      "name": "Cuadrilla 1"
    }
  }
]
```

---

### 8. Obtener Detalle de Orden
```http
GET /ops/work-orders/me/:id
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "titulo": "Reparación de cañería",
  "serviceCategory": "plomería",
  "description": "Fuga de agua en cocina",
  "state": "EN_PROGRESO",
  "prioridad": "ALTA",
  "address": "Av. San Martín 1234",
  "lat": -29.408660,
  "lng": -66.858431,
  "createdAt": "2025-11-28T10:00:00Z",
  "workType": {
    "id": "uuid",
    "nombre": "Reparación de cañería"
  },
  "crew": {
    "id": "uuid",
    "name": "Cuadrilla 1",
    "members": [...]
  },
  "client": {
    "id": "uuid",
    "nombreCompleto": "Nombre Cliente"
  }
}
```

---

### 9. Solicitar Nueva Orden de Trabajo
```http
POST /ops/work-orders/request
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
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
- `serviceCategory` (string): plomería|electricidad|gas|pintura|emergencia|etc.
- `situacion` (string): Descripción del problema

**Campos opcionales:**
- `workTypeId` (UUID): ID del tipo de trabajo
- `propertyId` (UUID): ID de la propiedad (si no se especifica, usa la primera activa)
- `peligroAccidente` (string): SI|NO|URGENTE
- `observaciones` (string): Observaciones adicionales
- `prioridad` (string): BAJA|MEDIA|ALTA|EMERGENCIA (se calcula automáticamente si es CUSTOMER)
- `canal` (string): APP|WEB|TELEFONO|WHATSAPP (default: APP)
- `cantidadEstimada` (number): Cantidad estimada
- `unidadCantidad` (string): m2|hora|visita|unidad

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Fuga de agua en la cocina",
    "serviceCategory": "plomería",
    "description": "Fuga de agua en la cocina, el agua está goteando constantemente\n\nLa fuga comenzó esta mañana, ya cerré la llave de paso",
    "state": "PENDIENTE",
    "prioridad": "MEDIA",
    "address": "Av. San Martín 1234",
    "lat": -29.408660,
    "lng": -66.858431,
    "createdAt": "2025-11-28T10:00:00Z"
  }
}
```

**Notas:**
- Si `peligroAccidente` es "URGENTE" o "SI", la prioridad se establece automáticamente como "EMERGENCIA"
- La orden se crea en estado `PENDIENTE`

---

### 10. Obtener Timeline de Orden
```http
GET /ops/work-orders/:id/timeline
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "CREATED",
    "description": "Orden creada",
    "createdAt": "2025-11-28T10:00:00Z",
    "user": {
      "id": "uuid",
      "name": "Cliente"
    }
  },
  {
    "id": "uuid",
    "type": "ASSIGNED",
    "description": "Asignada a Cuadrilla 1",
    "createdAt": "2025-11-28T11:00:00Z",
    "user": {
      "id": "uuid",
      "name": "Operador"
    }
  }
]
```

---

### 11. Listar Planes Disponibles
```http
GET /ops/plans
Authorization: Bearer {accessToken}
```

**Response (200):**
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

## 👷 ENDPOINTS PARA CUADRILLAS (Role: CREW)

### 1. Obtener Mi Cuadrilla
```http
GET /ops/crews/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Cuadrilla 1",
  "state": "ACTIVE",
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "email": "crew1@aaron.com",
        "fullName": "Juan Perez"
      },
      "role": "LEADER"
    }
  ],
  "lat": -29.408660,
  "lng": -66.858431,
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 2. Actualizar Ubicación de Cuadrilla
```http
PATCH /ops/crews/:id/location
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "lat": -29.408660,
  "lng": -66.858431
}
```

**Notas:**
- Actualizar periódicamente (cada 30 segundos) cuando la cuadrilla está en movimiento
- Usar para tracking en tiempo real

---

### 3. Obtener Órdenes Asignadas a Mi Cuadrilla
```http
GET /ops/work-orders
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `crewId`: ID de la cuadrilla (se obtiene de `/crews/me`)
- `state`: PENDIENTE|ASIGNADA|EN_PROGRESO|FINALIZADA|CANCELADA
- `skip`: número (paginación)
- `take`: número (límite)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "titulo": "Reparación de cañería",
      "serviceCategory": "plomería",
      "description": "Fuga de agua en cocina",
      "state": "ASIGNADA",
      "prioridad": "ALTA",
      "address": "Av. San Martín 1234",
      "lat": -29.408660,
      "lng": -66.858431,
      "createdAt": "2025-11-28T10:00:00Z",
      "client": {
        "id": "uuid",
        "nombreCompleto": "Nombre Cliente",
        "telefono": "+543804123456"
      }
    }
  ],
  "total": 10,
  "skip": 0,
  "take": 20
}
```

---

### 4. Obtener Detalle de Orden
```http
GET /ops/work-orders/:id
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "titulo": "Reparación de cañería",
  "serviceCategory": "plomería",
  "description": "Fuga de agua en cocina",
  "state": "ASIGNADA",
  "prioridad": "ALTA",
  "address": "Av. San Martín 1234",
  "lat": -29.408660,
  "lng": -66.858431,
  "createdAt": "2025-11-28T10:00:00Z",
  "workType": {
    "id": "uuid",
    "nombre": "Reparación de cañería"
  },
  "client": {
    "id": "uuid",
    "nombreCompleto": "Nombre Cliente",
    "telefono": "+543804123456",
    "direccionFacturacion": "Dirección completa"
  },
  "crew": {
    "id": "uuid",
    "name": "Cuadrilla 1"
  }
}
```

---

### 5. Cambiar Estado de Orden
```http
PATCH /ops/work-orders/:id/state
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "state": "EN_PROGRESO"
}
```

**Estados válidos:**
- `PENDIENTE`: Orden creada, esperando asignación
- `ASIGNADA`: Asignada a cuadrilla
- `EN_PROGRESO`: Cuadrilla en camino o trabajando
- `FINALIZADA`: Trabajo completado
- `CANCELADA`: Orden cancelada

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "state": "EN_PROGRESO",
    "updatedAt": "2025-11-28T12:00:00Z"
  }
}
```

---

### 6. Actualizar Progreso de Orden
```http
PATCH /ops/work-orders/:id/progress
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress": 50
}
```

**Notas:**
- `progress`: número entre 0 y 100
- Útil para mostrar progreso al cliente

---

### 7. Actualizar Ubicación de Orden
```http
POST /ops/work-orders/:id/location
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "lat": -29.408660,
  "lng": -66.858431
}
```

**Notas:**
- Actualizar cuando la cuadrilla llega al lugar
- Usar para mostrar ubicación en tiempo real al cliente

---

### 8. Obtener Timeline de Orden
```http
GET /ops/work-orders/:id/timeline
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "CREATED",
    "description": "Orden creada",
    "createdAt": "2025-11-28T10:00:00Z"
  },
  {
    "id": "uuid",
    "type": "ASSIGNED",
    "description": "Asignada a Cuadrilla 1",
    "createdAt": "2025-11-28T11:00:00Z"
  },
  {
    "id": "uuid",
    "type": "STATE_CHANGED",
    "description": "Estado cambiado a EN_PROGRESO",
    "createdAt": "2025-11-28T12:00:00Z",
    "user": {
      "id": "uuid",
      "name": "Cuadrilla 1"
    }
  }
]
```

---

## 🔑 ROLES Y PERMISOS

### Roles Disponibles
- **CUSTOMER**: Cliente final (app móvil)
- **CREW**: Miembro de cuadrilla (app móvil)
- **OPERATOR**: Operador del sistema (panel web)
- **ADMIN**: Administrador (panel web)

### Permisos por Rol

| Endpoint | CUSTOMER | CREW | OPERATOR | ADMIN |
|----------|----------|------|----------|-------|
| `/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/ops/clients/me` | ✅ | ❌ | ❌ | ❌ |
| `/ops/properties/me` | ✅ | ❌ | ❌ | ❌ |
| `/ops/subscriptions/me` | ✅ | ❌ | ❌ | ❌ |
| `/ops/work-orders/me` | ✅ | ❌ | ❌ | ❌ |
| `/ops/work-orders/request` | ✅ | ❌ | ✅ | ✅ |
| `/ops/crews/me` | ❌ | ✅ | ✅ | ✅ |
| `/ops/crews/:id/location` | ❌ | ✅ | ✅ | ✅ |
| `/ops/work-orders` (listar) | ❌ | ✅* | ✅ | ✅ |
| `/ops/work-orders/:id/state` | ❌ | ✅* | ✅ | ✅ |

*Solo para órdenes asignadas a su cuadrilla

---

## 📊 CÓDIGOS DE ESTADO HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| 200 | OK | Request exitoso |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Error en los datos enviados |
| 401 | Unauthorized | Token inválido o expirado - Refrescar token |
| 403 | Forbidden | Sin permisos para esta acción |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## 🔄 MANEJO DE TOKENS

### Flujo de Autenticación
1. Usuario hace login → Recibe `accessToken` y `refreshToken`
2. Guardar ambos tokens en almacenamiento seguro (SecureStorage en Flutter)
3. Incluir `accessToken` en header `Authorization: Bearer {accessToken}` en cada request
4. Si recibe 401 (Unauthorized):
   - Llamar a `/auth/refresh` con `refreshToken`
   - Actualizar ambos tokens
   - Reintentar el request original

### Implementación en Flutter
```dart
// Interceptor para manejar tokens automáticamente
class AuthInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Refrescar token y reintentar
      refreshToken().then((_) {
        // Reintentar request original
      });
    }
    super.onError(err, handler);
  }
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Base URL**: Todos los endpoints usan la base URL del API Gateway
2. **Autenticación**: Todos los endpoints excepto `/auth/*` requieren `Authorization` header
3. **Coordenadas**: Muchos endpoints requieren `lat` y `lng` (GPS)
4. **Paginación**: Endpoints de listado soportan `skip` y `take`
5. **Estados**: Los estados de órdenes siguen un flujo específico
6. **Timeline**: Todas las órdenes tienen un timeline de eventos
7. **Roles**: Verificar el rol del usuario después del login para mostrar vistas apropiadas

---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

## 🚀 PRÓXIMOS PASOS PARA FLUTTER

1. **Configurar Base URL** en archivo de configuración
2. **Implementar AuthService** para manejar login, signup, refresh token
3. **Crear Interceptor** para agregar token automáticamente
4. **Implementar modelos** (User, WorkOrder, Crew, etc.)
5. **Crear servicios** por módulo (AuthService, WorkOrderService, CrewService)
6. **Implementar vistas** según rol:
   - **CUSTOMER**: Dashboard, Mis Órdenes, Solicitar Orden, Perfil
   - **CREW**: Dashboard, Órdenes Asignadas, Detalle Orden, Actualizar Estado, Tracking
7. **Implementar navegación** basada en roles
8. **Agregar manejo de errores** global
9. **Implementar refresh token** automático
10. **Agregar loading states** y manejo de estados offline

---

## 📞 ENDPOINTS ADICIONALES (Futuro)

- **Notificaciones Push**: `/notifications/me`
- **Historial de Pagos**: `/ops/payments/me`
- **Actualizar Perfil**: `PATCH /ops/clients/:id`
- **Cambiar Contraseña**: `POST /auth/change-password`
- **WebSocket Tracking**: `ws://localhost:3003/ws/track?token={accessToken}`

---

## 🗺️ CONFIGURACIÓN DE GOOGLE MAPS

### Credenciales

Las siguientes credenciales se usan en el proyecto web y deben usarse también en la app móvil:

#### API Key
```
AIzaSyCxDpBudd3WuLMHmNpUbFeDdExXZuKOaJY
```

#### Map ID (Estilo Personalizado)
```
9c96b18e81ab19904121ac45
```

**Nota:** Este Map ID está asociado al estilo personalizado "Mapa Delivery v0 dev" (estilo oscuro) publicado en Google Cloud Platform.

---

### Configuración en Flutter

#### 1. Agregar dependencia

En `pubspec.yaml`:
```yaml
dependencies:
  google_maps_flutter: ^2.5.0
```

#### 2. Configurar API Key

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<manifest>
  <application>
    <meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="AIzaSyCxDpBudd3WuLMHmNpUbFeDdExXZuKOaJY"/>
  </application>
</manifest>
```

**iOS** (`ios/Runner/AppDelegate.swift`):
```swift
import UIKit
import GoogleMaps

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyCxDpBudd3WuLMHmNpUbFeDdExXZuKOaJY")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

**iOS** (También en `ios/Runner/AppDelegate.m` si usas Objective-C):
```objc
#import "AppDelegate.h"
#import "GeneratedPluginRegistrant.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"AIzaSyCxDpBudd3WuLMHmNpUbFeDdExXZuKOaJY"];
  [GeneratedPluginRegistrant registerWithRegistry:self];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
```

#### 3. Usar Map ID en el mapa

```dart
import 'package:google_maps_flutter/google_maps_flutter.dart';

GoogleMap(
  initialCameraPosition: CameraPosition(
    target: LatLng(-29.408660, -66.858431),
    zoom: 13.0,
  ),
  mapType: MapType.normal,
  myLocationEnabled: true,
  myLocationButtonEnabled: true,
  // Usar el Map ID del estilo personalizado
  mapId: '9c96b18e81ab19904121ac45',
  markers: Set<Marker>.from([
    Marker(
      markerId: MarkerId('1'),
      position: LatLng(-29.408660, -66.858431),
      infoWindow: InfoWindow(title: 'Ubicación'),
    ),
  ]),
)
```

#### 4. Habilitar permisos

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Esta app necesita acceso a tu ubicación para mostrar servicios cercanos</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Esta app necesita acceso a tu ubicación para tracking en tiempo real</string>
```

---

### APIs Habilitadas en Google Cloud Console

Asegúrate de que la siguiente API esté habilitada en tu proyecto de Google Cloud:

- ✅ **Maps SDK for Android** (para Android)
- ✅ **Maps SDK for iOS** (para iOS)
- ✅ **Maps JavaScript API** (ya habilitada para el web)

**URL para habilitar APIs:**
```
https://console.cloud.google.com/apis/library
```

---

### Verificación del Estilo Personalizado

El Map ID `9c96b18e81ab19904121ac45` está asociado al estilo personalizado **"Mapa Delivery v0 dev"**.

Para verificar o cambiar el estilo:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **Administración de mapas** → **Map IDs**
3. Busca el Map ID: `9c96b18e81ab19904121ac45`
4. Verifica que tenga el estilo asociado
5. Asegúrate de que el estilo esté **Publicado** (no solo guardado)

---

### Notas Importantes

1. **Restricciones de API Key**: Considera restringir la API Key por:
   - Aplicación Android (package name + SHA-1)
   - Aplicación iOS (bundle ID)
   - Dominios web (para el proyecto web)

2. **Costo**: Google Maps tiene límites gratuitos. Revisa la [facturación](https://console.cloud.google.com/billing) regularmente.

3. **Map ID**: El Map ID `9c96b18e81ab19904121ac45` aplica automáticamente el estilo personalizado configurado en Google Cloud Platform.

4. **Testing**: Durante desarrollo, puedes usar la misma API Key para ambas plataformas. En producción, considera usar API Keys separadas para mejor control.

---

**Última actualización**: 2025-12-01
**Versión API**: 1.0.0

