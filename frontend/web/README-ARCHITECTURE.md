# Arquitectura del Frontend - Aaron Backoffice

## Estructura de Carpetas

```
frontend/web/
├── app/
│   ├── (auth)/              # Grupo de rutas de autenticación
│   │   ├── layout.tsx       # Layout sin sidebar para login
│   │   └── login/
│   │       └── page.tsx     # Página de login
│   ├── (app)/               # Grupo de rutas de la aplicación interna
│   │   ├── layout.tsx       # Layout con sidebar y header
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── solicitudes/     # Gestión de solicitudes
│   │   ├── ordenes/         # Órdenes de trabajo
│   │   ├── metricas/        # Métricas y estadísticas
│   │   ├── usuarios/        # Gestión de usuarios (solo ADMIN)
│   │   └── configuracion/   # Configuración (solo ADMIN)
│   ├── layout.tsx           # Layout raíz
│   └── page.tsx             # Página raíz (redirige a /login)
├── components/
│   └── layout/
│       ├── sidebar.tsx      # Sidebar de navegación
│       └── header.tsx       # Header con info del usuario
├── lib/
│   ├── auth/
│   │   ├── types.ts         # Tipos del dominio de autenticación
│   │   ├── auth.service.ts  # Servicio de autenticación (domain layer)
│   │   ├── auth.store.ts    # Store de Zustand (presentation layer)
│   │   └── hooks/
│   │       └── use-auth.ts  # Hook para consumir auth store
│   └── api/
│       └── client.ts        # Cliente HTTP (infrastructure layer)
└── middleware.ts            # Middleware de Next.js para protección de rutas
```

## Arquitectura Limpia

La aplicación sigue los principios de Clean Architecture y SOLID:

### Capas

1. **Domain Layer** (`lib/auth/types.ts`, `lib/auth/auth.service.ts`)
   - Lógica de negocio pura
   - Tipos del dominio
   - Servicios que definen interfaces (IAuthService)
   - Sin dependencias de frameworks

2. **Infrastructure Layer** (`lib/api/client.ts`, `middleware.ts`)
   - Cliente HTTP
   - Middleware de Next.js
   - Manejo de tokens
   - Comunicación con el backend

3. **Presentation Layer** (`components/`, `app/`, `lib/auth/auth.store.ts`, `lib/auth/hooks/use-auth.ts`)
   - Componentes React
   - Estado global (Zustand)
   - Hooks personalizados
   - Páginas y layouts

### Principios SOLID

- **Single Responsibility**: Cada módulo tiene una responsabilidad clara
  - `auth.service.ts`: Lógica de autenticación
  - `auth.store.ts`: Estado global
  - `use-auth.ts`: Hook para consumir el estado
  - `api.client.ts`: Comunicación HTTP

- **Open/Closed**: Interfaces extensibles (IAuthService)
- **Liskov Substitution**: Implementaciones intercambiables
- **Interface Segregation**: Interfaces específicas
- **Dependency Inversion**: Dependencias hacia abstracciones

## Autenticación

### Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. `useAuth().signIn()` llama a `authService.signIn()`
3. `authService` hace POST a `/api/auth/signin`
4. Se recibe `{ user, tokens }` del backend
5. Se guarda en `auth.store` y localStorage
6. Middleware protege rutas basado en token
7. Layout `(app)/layout.tsx` verifica autenticación

### Protección de Rutas

- **Middleware** (`middleware.ts`): Protección a nivel de servidor
- **Layout Guards**: Verificación en el cliente en `(app)/layout.tsx`
- **Role-based Access**: Verificación de roles en componentes específicos

### Roles

- `ADMIN`: Acceso completo
- `OPERATOR`: Operaciones básicas
- `CREW`: Equipo de trabajo
- `CUSTOMER`: Cliente

## Navegación

### Sidebar

El sidebar muestra diferentes items según el rol:
- **Dashboard**: Todos los roles
- **Solicitudes**: Todos los roles
- **Órdenes de Trabajo**: Todos los roles
- **Métricas**: Todos los roles
- **Usuarios**: Solo ADMIN
- **Configuración**: Solo ADMIN

## Estado Global

Se usa **Zustand** para el estado global de autenticación:
- Persistencia en localStorage
- Sincronización automática
- Estado reactivo

## API Client

El cliente API (`lib/api/client.ts`):
- Agrega automáticamente el token JWT
- Maneja errores centralizadamente
- Tipado con TypeScript
- Interfaz simple (get, post, patch, delete)

## Próximos Pasos

1. Implementar las vistas de cada sección
2. Agregar validación de formularios (Zod)
3. Agregar notificaciones (Toast)
4. Implementar refresh token automático
5. Agregar tests unitarios e integración

