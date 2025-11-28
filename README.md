# Aaron Backend Services - Monorepo

Monorepo para servicios backend de Aaron, utilizando pnpm workspaces y TypeScript.

## 📁 Estructura del Proyecto

```
/
├── apps/                    # Microservicios
│   ├── api-gateway/        # API Gateway - Punto de entrada
│   ├── auth-service/       # Servicio de autenticación y autorización
│   ├── operations-service/ # Servicio de operaciones
│   └── tracking-service/   # Servicio de seguimiento
│
├── libs/                    # Bibliotecas compartidas
│   ├── common/             # Filtros, pipes, exceptions, logger, helpers, Result<E, A>
│   ├── auth/               # Guards, decorators (@CurrentUser), helpers Casbin/RBAC
│   ├── mail/               # Wrapper para Resend
│   └── prisma/             # Factory de Prisma Client + Middleware
│
├── infra/                   # Infraestructura
│   ├── docker-compose.yml  # Configuración de Docker Compose
│   └── nginx/              # Configuración opcional de Nginx (TLS/HTTP2)
│
├── scripts/                 # Scripts utilitarios
│   ├── dev.sh              # Script para desarrollo local
│   └── migrate_all.sh      # Script para migraciones de Prisma
│
├── package.json             # Configuración de workspaces
├── pnpm-workspace.yaml      # Configuración de pnpm
└── tsconfig.base.json       # Configuración base de TypeScript
```

## 🚀 Inicio Rápido

### Instalación Automática (Recomendado)

```bash
# Ejecuta todos los pasos automáticamente:
pnpm init
```

Esto ejecutará:
1. Instalación de dependencias
2. Configuración de .env
3. Levantamiento de PostgreSQL y Redis
4. Creación de schemas
5. Generación de Prisma Clients
6. Ejecución de migraciones

### Instalación Manual

```bash
# 1. Instalar pnpm (si no lo tienes)
npm install -g pnpm

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
pnpm env:setup

# 4. Levantar PostgreSQL y Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# 5. Crear schemas
pnpm schemas:create

# 6. Generar Prisma Clients y migraciones
pnpm prisma:generate
pnpm migrate:all
```

### Arrancar Servicios

En **4 terminales separadas**:

```bash
# Terminal 1 - Auth Service
pnpm --filter @aaron/auth-service dev

# Terminal 2 - Operations Service
pnpm --filter @aaron/operations-service dev

# Terminal 3 - Tracking Service
pnpm --filter @aaron/tracking-service dev

# Terminal 4 - API Gateway
pnpm --filter @aaron/api-gateway dev
```

Ver `QUICKSTART.md` para guía detallada paso a paso.

### Desarrollo

```bash
# Iniciar todos los servicios en modo desarrollo
pnpm dev

# O usando el script directamente
bash scripts/dev.sh
```

Cada servicio se ejecutará en su propio puerto:
- API Gateway: `http://localhost:3000`
- Auth Service: `http://localhost:3001`
- Operations Service: `http://localhost:3002`
- Tracking Service: `http://localhost:3003`

### Desarrollo con Docker (Recomendado)

El proyecto utiliza un enfoque **unificado** donde todos los servicios (Frontend, Gateway, Auth, Operations, Tracking) se ejecutan coordinados.

```bash
# 1. Iniciar todo (Frontend + Backend + DBs)
docker compose up --build -d

# 2. Ver logs
docker compose logs -f app

# 3. Detener todo
docker compose down
```

**URLs de Acceso:**

- **Frontend (Web):** http://localhost:3000
- **API Gateway:** http://localhost:3100
- **PostgreSQL:** localhost:5432 (User: `app`, Pass: `app`, DB: `app`)
- **Redis:** localhost:6379

**Solución de Problemas:**

Si tienes conflictos con contenedores antiguos:

```bash
# Limpieza y reinicio
docker compose down --remove-orphans
docker compose up --build -d
```

## 📦 Workspaces

### Apps (Microservicios)

Cada servicio tiene su propia estructura independiente:

- `package.json` - Dependencias específicas
- `tsconfig.json` - Configuración de TypeScript
- `Dockerfile` - Imagen Docker para producción
- `.env.example` - Variables de entorno de ejemplo
- `src/` - Código fuente del servicio

#### API Gateway

Punto de entrada principal que enruta las solicitudes a los microservicios correspondientes.

#### Auth Service

Servicio de autenticación y autorización:
- Gestión de usuarios
- JWT tokens
- RBAC/Casbin para control de acceso

#### Operations Service

Servicio de operaciones del negocio.

#### Tracking Service

Servicio de seguimiento y trazabilidad.

### Libs (Bibliotecas Compartidas)

#### @aaron/common

Biblioteca común con utilidades compartidas:
- **Filtros**: Manejo global de excepciones
- **Pipes**: Validación de datos
- **Exceptions**: Excepciones personalizadas
- **Logger**: Sistema de logging
- **Helpers**: Helpers para ID, UUID, etc.
- **Result<E, A>**: Tipo funcional para manejo de errores

#### @aaron/auth

Biblioteca de autenticación y autorización:
- **Guards**: Guards de autenticación y roles
- **Decorators**: Decorator `@CurrentUser` para obtener usuario actual
- **RBAC**: Helpers para Casbin y gestión de políticas

#### @aaron/mail

Wrapper para el servicio de envío de emails Resend.

#### @aaron/prisma

Factory y middleware para Prisma Client:
- Factory para crear instancias de Prisma
- Middleware de logging
- Middleware de soft delete
- Cada servicio usa su propio schema

## 🔧 Configuración

### Variables de Entorno

Cada servicio tiene su propio archivo `.env.example`. Puedes configurarlos automáticamente:

```bash
# Setup rápido (copia .env.example a .env en todos los servicios)
pnpm env:setup

# O manualmente para cada servicio
cd apps/[service-name]
cp .env.example .env
# Editar .env con tus valores
```

**Configuración importante:**
- **Local (sin Docker)**: Usa `localhost:3307` para PostgreSQL, `localhost:6379` para Redis
- **Docker**: Usa `postgres:5432` para PostgreSQL, `redis:6379` para Redis
- **JWT Secrets**: Deben coincidir entre `auth-service`, `api-gateway` y `tracking-service`

Ver `ENV_SETUP.md` para configuración detallada de cada servicio.

**Nota**: Todos los servicios comparten la misma base de datos PostgreSQL (`app`). Desde dentro de Docker, usa `postgres:5432`. Desde fuera (ej: DBeaver), usa `localhost:3307`.

### TypeScript

El proyecto usa un `tsconfig.base.json` compartido con paths configurados para las bibliotecas:

```typescript
import { Logger } from '@aaron/common';
import { AuthGuard } from '@aaron/auth';
import { MailService } from '@aaron/mail';
import { PrismaFactory } from '@aaron/prisma';
```

### Prisma

**Estrategia de Schemas: Múltiples Schemas en una Base de Datos**

Todos los servicios comparten la misma base de datos PostgreSQL (`app`), pero utilizan **schemas separados** para aislar sus datos:

- **auth-service** → Schema: `auth`
  - Tablas: usuarios, cuentas OAuth, roles, sessions, audit_auth
  
- **operations-service** → Schema: `operations`
  - Tablas: suscripciones, planes, pagos, órdenes, cuadrillas, métricas, agenda
  
- **tracking-service** → Schema: `tracking`
  - Tablas: sessions WS, pings, rutas, eventos movilidad

Cada servicio tiene su propio schema de Prisma en:
```
apps/[service-name]/prisma/schema.prisma
```

**Configuración de DATABASE_URL:**

```bash
# Desde dentro de Docker
DATABASE_URL="postgresql://app:app@postgres:5432/app?schema=auth"
DATABASE_URL="postgresql://app:app@postgres:5432/app?schema=operations"
DATABASE_URL="postgresql://app:app@postgres:5432/app?schema=tracking"

# Desde local (sin Docker)
DATABASE_URL="postgresql://app:app@localhost:3307/app?schema=auth"
```

**Crear schemas en PostgreSQL:**

Antes de ejecutar las migraciones, es necesario crear los schemas en la base de datos:

```bash
# Crear schemas (después de iniciar docker-compose)
pnpm schemas:create
# o
bash scripts/create_schemas.sh
```

Esto creará los schemas `auth`, `operations` y `tracking` en la base de datos.

**Ejecutar migraciones:**

```bash
bash scripts/migrate_all.sh
# o
pnpm migrate:all
```

**Nota:** Prisma requiere la feature preview `multiSchema` para trabajar con múltiples schemas en PostgreSQL. Esta feature está habilitada en todos los schemas de Prisma.

## 📝 Scripts Disponibles

### Root

- `pnpm install` - Instala todas las dependencias del workspace
- `pnpm dev` - Inicia todos los servicios en modo desarrollo
- `pnpm env:setup` - Copia .env.example a .env en todos los servicios
- `pnpm prisma:generate` - Genera Prisma Client en todos los servicios
- `pnpm schemas:create` - Crea los schemas en PostgreSQL (ejecutar antes de migraciones)
- `pnpm migrate:all` - Ejecuta migraciones de Prisma en todos los servicios

### Por Servicio

Cada servicio tiene sus propios scripts en su `package.json`:
- `pnpm build` - Compilar TypeScript
- `pnpm start` - Ejecutar en producción
- `pnpm dev` - Modo desarrollo con hot-reload
- `pnpm lint` - Linter
- `pnpm test` - Tests

## 🐳 Docker

Cada servicio tiene su propio `Dockerfile` optimizado para producción. El `docker-compose.yml` en la raíz orquesta todo el sistema:

- **1 base de datos PostgreSQL** compartida con múltiples schemas (auth, operations, tracking)
- **1 servidor Redis** para cache y sesiones
- **1 contenedor unificado (app)** que ejecuta todos los microservicios y el frontend en paralelo.

## 🏗️ Arquitectura

- **Monorepo**: Gestión centralizada de código
- **Microservicios**: Cada servicio es independiente
- **Workspaces**: Compartir código mediante bibliotecas
- **TypeScript**: Tipado estático en todo el proyecto
- **Prisma**: ORM con múltiples schemas en una sola base de datos PostgreSQL

## 📚 Próximos Pasos

1. Configurar variables de entorno en cada `.env` (copiar desde `.env.example`)
2. Instalar dependencias: `pnpm install`
3. Generar Prisma Clients: `pnpm prisma:generate`
4. (Con Docker) Iniciar servicios: `docker compose -f infra/docker-compose.yml up -d postgres redis`
5. Crear schemas en PostgreSQL: `pnpm schemas:create`
6. Ejecutar migraciones: `pnpm migrate:all`
7. Iniciar servicios: `pnpm dev`
8. Implementar la lógica de negocio en cada servicio
9. Configurar CI/CD
10. Agregar tests unitarios e integración

## 📖 Documentación Adicional

Toda la documentación se encuentra organizada en la carpeta [`docs/`](./docs/):

- 📚 [Índice de Documentación](./docs/INDEX.md) - Índice completo
- 🚀 [Guía de Inicio Rápido](./docs/guides/QUICK_START.md)
- ⚙️ [Setup Completo](./docs/setup/SETUP_COMPLETE.md)
- 🔧 [Configuración de Variables de Entorno](./docs/setup/ENV_SETUP.md)
- 🐳 [Docker Setup](./docs/guides/DOCKER_SETUP.md)

Ver [`docs/INDEX.md`](./docs/INDEX.md) para la documentación completa de servicios, librerías y guías.

## 🤝 Contribución

1. Crear una rama desde `main`
2. Realizar cambios
3. Commit con mensajes descriptivos
4. Push y crear Pull Request

## 📄 Licencia

[Especificar licencia]

