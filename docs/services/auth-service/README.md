# Auth Service

Servicio de autenticación y autorización para Aaron Backend.

## Funcionalidades

- ✅ Signup (email + password) con verificación por correo (Resend)
- ✅ Login / Logout
- ✅ Refresh tokens (JWT + refresh rotativo)
- ✅ Reset password (email magic link)
- ✅ Google OAuth (Passport Google)
- ✅ CRUD de usuarios (admin)
- ✅ **Administración de Roles (RBAC)** - Crear, asignar, remover roles
- ✅ Auditoría de accesos
- ✅ Webhooks de eventos (opcional) hacia operations/tracking

## Endpoints

### Autenticación

- `POST /auth/signup` - Registro de nuevo usuario
- `POST /auth/signin` - Login
- `POST /auth/signout` - Logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Solicitar reset de contraseña
- `POST /auth/reset-password` - Reset de contraseña con token
- `GET /auth/google` - Iniciar OAuth Google
- `GET /auth/google/callback` - Callback de OAuth Google

### Usuarios

- `GET /users/me` - Obtener usuario actual
- `GET /users` - Listar usuarios (admin)
- `POST /users` - Crear usuario (admin)
- `PATCH /users/:id` - Actualizar usuario (admin)
- `DELETE /users/:id` - Eliminar usuario (admin)

### Roles (Admin)

- `GET /roles` - Listar todos los roles
- `GET /roles/:id` - Obtener rol por ID (con usuarios)
- `POST /roles` - Crear nuevo rol
- `DELETE /roles/:id` - Eliminar rol

### Asignación de Roles (Admin)

- `POST /roles/assign` - Asignar rol a usuario (por ID)
  ```json
  {
    "userId": "uuid",
    "roleId": "uuid"
  }
  ```

- `POST /roles/assign-by-name` - Asignar rol a usuario (por nombre)
  ```json
  {
    "userId": "uuid",
    "roleName": "ADMIN"
  }
  ```

- `DELETE /roles/:roleId/user/:userId` - Remover rol de usuario

### Gestión de Roles de Usuario

- `GET /roles/users/:userId/roles` - Obtener roles de un usuario
- `PATCH /roles/users/:userId/roles` - Actualizar roles de usuario (reemplaza todos)
  ```json
  {
    "roleIds": ["uuid1", "uuid2"]
  }
  ```

## Roles Disponibles

- `ADMIN` - Administrador completo (puede gestionar usuarios y roles)
- `OPERATOR` - Operador del sistema
- `CREW` - Personal de campo
- `CUSTOMER` - Cliente

## Seguridad

- JWT Access Token: 15 minutos (900s)
- JWT Refresh Token: 30 días
- Rate limiting en endpoints de autenticación
- Password hashing con bcrypt (10 rounds)
- Validación de datos con Zod

## Guards y Decorators

El servicio usa guards y decorators de `@aaron/auth`:

```typescript
import { JwtAuthGuard, RolesGuard } from '@aaron/auth';
import { getCurrentUser, getCurrentUserId } from '@aaron/auth';

// Uso en rutas
router.use(JwtAuthGuard.middleware());
router.use(RolesGuard.middleware('ADMIN'));

// En controllers
const userId = getCurrentUserId(req);
const user = getCurrentUser(req);
```

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# Desarrollo
pnpm dev

# Build
pnpm build

# Producción
pnpm start
```

## Base de Datos

El servicio usa el schema `auth` en la base de datos compartida.

### Modelos Principales

- `User` - Usuarios
- `Role` - Roles
- `Session` - Sesiones con refresh tokens
- `EmailAudit` - Auditoría de emails enviados
