# Reestructuración: Frontend/Backend Separados + Clean Architecture

## 🎯 Objetivo

Crear una estructura clara que:
- ✅ Separe completamente frontend y backend
- ✅ Aplique Clean Architecture y SOLID
- ✅ Mantenga tipos compartidos de forma controlada
- ✅ Sea escalable y mantenible

## 📁 Nueva Estructura Propuesta

```
/
├── backend/                    # ← Todo el backend aquí
│   ├── services/              # Microservicios
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── operations-service/
│   │   └── tracking-service/
│   │
│   └── shared/                # Librerías compartidas SOLO backend
│       ├── common/           # Filtros, pipes, exceptions, logger
│       ├── auth/             # Guards, decorators, RBAC
│       ├── mail/             # Email service
│       └── prisma/           # Prisma factory
│
├── frontend/                  # ← Todo el frontend aquí
│   └── web/                  # Next.js 16
│       ├── app/             # App Router
│       ├── src/
│       │   ├── domain/      # Clean Architecture: Domain Layer
│       │   ├── application/ # Clean Architecture: Use Cases
│       │   ├── infrastructure/ # Clean Architecture: Adapters
│       │   └── presentation/   # Clean Architecture: UI
│       └── package.json
│
├── shared/                    # ← Tipos y contratos compartidos
│   └── types/                # SOLO tipos TypeScript compartidos
│       ├── api/             # DTOs, interfaces de API
│       ├── domain/          # Entidades compartidas (si aplica)
│       └── index.ts
│
├── infra/                     # Infraestructura
│   ├── docker-compose.yml
│   └── nginx/
│
├── scripts/                   # Scripts utilitarios
│
├── package.json              # Root package.json
├── pnpm-workspace.yaml
├── turbo.json                # Turbo Repo config
└── tsconfig.base.json
```

## 🔄 Migración de Estructura Actual

### Paso 1: Crear nuevas carpetas

```bash
# Crear estructura
mkdir -p backend/services
mkdir -p backend/shared
mkdir -p frontend/web
mkdir -p shared/types
```

### Paso 2: Mover servicios backend

```bash
# Mover servicios
mv apps/api-gateway backend/services/
mv apps/auth-service backend/services/
mv apps/operations-service backend/services/
mv apps/tracking-service backend/services/

# Mover librerías backend
mv libs/common backend/shared/
mv libs/auth backend/shared/
mv libs/mail backend/shared/
mv libs/prisma backend/shared/
```

### Paso 3: Actualizar `pnpm-workspace.yaml`

```yaml
packages:
  - 'backend/services/*'
  - 'backend/shared/*'
  - 'frontend/*'
  - 'shared/*'
```

### Paso 4: Actualizar `tsconfig.base.json`

```json
{
  "compilerOptions": {
    // ... existing config ...
    "paths": {
      // Backend shared
      "@aaron/common": ["backend/shared/common/src"],
      "@aaron/common/*": ["backend/shared/common/src/*"],
      "@aaron/auth": ["backend/shared/auth/src"],
      "@aaron/auth/*": ["backend/shared/auth/src/*"],
      "@aaron/mail": ["backend/shared/mail/src"],
      "@aaron/mail/*": ["backend/shared/mail/src/*"],
      "@aaron/prisma": ["backend/shared/prisma/src"],
      "@aaron/prisma/*": ["backend/shared/prisma/src/*"],
      
      // Shared types (frontend + backend)
      "@shared/types": ["shared/types/src"],
      "@shared/types/*": ["shared/types/src/*"]
    }
  }
}
```

### Paso 5: Actualizar `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## 🏗️ Clean Architecture en Backend

### Estructura por Servicio (Ejemplo: auth-service)

```
backend/services/auth-service/
├── src/
│   ├── domain/                    # Capa de Dominio (Core)
│   │   ├── entities/             # Entidades de negocio
│   │   │   ├── user.entity.ts
│   │   │   └── role.entity.ts
│   │   ├── repositories/         # Interfaces (contratos)
│   │   │   ├── user.repository.ts
│   │   │   └── role.repository.ts
│   │   └── value-objects/        # Value Objects
│   │       └── email.vo.ts
│   │
│   ├── application/               # Capa de Aplicación (Use Cases)
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── signup.use-case.ts
│   │   │   │   ├── signin.use-case.ts
│   │   │   │   └── refresh-token.use-case.ts
│   │   │   └── users/
│   │   │       └── create-user.use-case.ts
│   │   └── dto/                   # DTOs de aplicación
│   │
│   ├── infrastructure/            # Capa de Infraestructura (Adapters)
│   │   ├── persistence/          # Implementación de repositorios
│   │   │   ├── prisma/
│   │   │   │   ├── user.repository.ts
│   │   │   │   └── role.repository.ts
│   │   ├── external/             # Servicios externos
│   │   │   ├── email/
│   │   │   │   └── resend-email.service.ts
│   │   └── config/               # Configuración
│   │
│   └── presentation/              # Capa de Presentación (Controllers)
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   └── users.controller.ts
│       ├── dto/                   # DTOs de API
│       └── guards/                # Guards de NestJS
│
├── prisma/
└── package.json
```

### Principios SOLID Aplicados

#### 1. Single Responsibility Principle (SRP)

**❌ Antes:**
```typescript
// Un servicio que hace todo
class AuthService {
  async signup() { /* ... */ }
  async signin() { /* ... */ }
  async sendEmail() { /* ... */ }
  async hashPassword() { /* ... */ }
}
```

**✅ Después:**
```typescript
// Cada clase tiene una responsabilidad
class SignupUseCase {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private emailService: EmailService
  ) {}
  
  async execute(dto: SignupDto): Promise<User> {
    // Solo lógica de signup
  }
}

class PasswordHasher {
  async hash(password: string): Promise<string> {
    // Solo hash de passwords
  }
}
```

#### 2. Open/Closed Principle (OCP)

**✅ Ejemplo:**
```typescript
// Abierto para extensión, cerrado para modificación
interface EmailService {
  send(email: Email): Promise<void>;
}

class ResendEmailService implements EmailService {
  async send(email: Email) { /* Resend */ }
}

class SendGridEmailService implements EmailService {
  async send(email: Email) { /* SendGrid */ }
}

// Use case no cambia si agregamos otro provider
class SignupUseCase {
  constructor(private emailService: EmailService) {}
}
```

#### 3. Liskov Substitution Principle (LSP)

**✅ Ejemplo:**
```typescript
// Cualquier implementación de UserRepository debe funcionar
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

class PrismaUserRepository implements UserRepository {
  // Implementación con Prisma
}

class InMemoryUserRepository implements UserRepository {
  // Implementación en memoria (tests)
}

// El use case funciona con cualquiera
class GetUserUseCase {
  constructor(private userRepo: UserRepository) {}
}
```

#### 4. Interface Segregation Principle (ISP)

**❌ Antes:**
```typescript
interface UserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  updatePassword(id: string, hash: string): Promise<void>;
  // ... 20 métodos más
}
```

**✅ Después:**
```typescript
// Interfaces pequeñas y específicas
interface UserReader {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

interface UserWriter {
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

interface UserPasswordManager {
  updatePassword(id: string, hash: string): Promise<void>;
}

// Implementación puede usar todas o solo algunas
class PrismaUserRepository implements UserReader, UserWriter {
  // ...
}
```

#### 5. Dependency Inversion Principle (DIP)

**❌ Antes:**
```typescript
// Depende de implementación concreta
class SignupUseCase {
  async execute(dto: SignupDto) {
    const prisma = new PrismaClient();
    const user = await prisma.user.create({ /* ... */ });
  }
}
```

**✅ Después:**
```typescript
// Depende de abstracción (interfaz)
class SignupUseCase {
  constructor(
    private userRepo: UserRepository,  // Interfaz, no implementación
    private emailService: EmailService
  ) {}
  
  async execute(dto: SignupDto) {
    const user = await this.userRepo.save(newUser);
  }
}
```

## 🎨 Clean Architecture en Frontend (Next.js)

### Estructura

```
frontend/web/
├── app/                         # Next.js App Router (routing)
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   └── dashboard/
│
├── src/
│   ├── domain/                  # Capa de Dominio
│   │   ├── entities/           # Entidades del frontend
│   │   │   ├── user.entity.ts
│   │   │   └── subscription.entity.ts
│   │   └── value-objects/      # Value Objects
│   │
│   ├── application/            # Capa de Aplicación
│   │   ├── use-cases/         # Use cases del frontend
│   │   │   ├── auth/
│   │   │   │   ├── login.use-case.ts
│   │   │   │   └── logout.use-case.ts
│   │   │   └── subscriptions/
│   │   │       └── get-subscriptions.use-case.ts
│   │   └── services/          # Servicios de aplicación
│   │       └── auth.service.ts
│   │
│   ├── infrastructure/         # Capa de Infraestructura
│   │   ├── api/               # Cliente API
│   │   │   ├── api-client.ts
│   │   │   └── endpoints/
│   │   │       ├── auth.endpoints.ts
│   │   │       └── subscriptions.endpoints.ts
│   │   ├── storage/           # LocalStorage, SessionStorage
│   │   │   └── token-storage.ts
│   │   └── websocket/         # WebSocket client
│   │       └── tracking-client.ts
│   │
│   └── presentation/          # Capa de Presentación
│       ├── components/        # Componentes React
│       │   ├── ui/           # Componentes base
│       │   └── features/     # Componentes de features
│       ├── hooks/            # Custom hooks
│       │   ├── use-auth.ts
│       │   └── use-subscriptions.ts
│       └── pages/            # Páginas (si usas Pages Router)
│
└── package.json
```

### Ejemplo: Login Use Case (Frontend)

```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly roles: string[]
  ) {}
}

// application/use-cases/auth/login.use-case.ts
export class LoginUseCase {
  constructor(
    private authApi: AuthApiClient,      // Interfaz
    private tokenStorage: TokenStorage   // Interfaz
  ) {}
  
  async execute(email: string, password: string): Promise<User> {
    const response = await this.authApi.login({ email, password });
    await this.tokenStorage.save(response.accessToken);
    return new User(
      response.user.id,
      response.user.email,
      response.user.fullName,
      response.user.roles
    );
  }
}

// infrastructure/api/auth-api-client.ts
export class AuthApiClient implements IAuthApiClient {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
    return res.json();
  }
}

// presentation/hooks/use-auth.ts
export function useAuth() {
  const loginUseCase = useLoginUseCase(); // Dependency injection
  
  const login = async (email: string, password: string) => {
    return await loginUseCase.execute(email, password);
  };
  
  return { login };
}

// app/(auth)/login/page.tsx
export default function LoginPage() {
  const { login } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    await login(email, password);
  };
  
  return <LoginForm onSubmit={handleSubmit} />;
}
```

## 📦 Tipos Compartidos (shared/)

### Estructura

```
shared/types/
├── src/
│   ├── api/                    # Contratos de API
│   │   ├── auth/
│   │   │   ├── signup.dto.ts
│   │   │   └── signin.dto.ts
│   │   └── subscriptions/
│   │       └── subscription.dto.ts
│   │
│   ├── domain/                 # Entidades compartidas (opcional)
│   │   └── user.types.ts
│   │
│   └── index.ts               # Exports
│
└── package.json
```

### Regla de Oro: SOLO Tipos

**✅ Permitido:**
- Interfaces TypeScript
- Types
- Enums
- Constantes (si son compartidas)

**❌ NO Permitido:**
- Implementaciones
- Lógica de negocio
- Servicios
- Utilidades

### Ejemplo

```typescript
// shared/types/src/api/auth/signup.dto.ts
export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface SignupResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Backend usa esto para validar requests
// Frontend usa esto para tipar llamadas API
```

## 🔒 Separación Estricta Frontend/Backend

### Reglas

1. **Backend NO importa de frontend**
   ```typescript
   // ❌ NUNCA hacer esto en backend
   import { Component } from '@/frontend/web/src/...'
   ```

2. **Frontend NO importa implementaciones de backend**
   ```typescript
   // ❌ NUNCA hacer esto en frontend
   import { UserService } from '@/backend/services/auth-service/...'
   
   // ✅ Solo tipos compartidos
   import { User } from '@shared/types'
   ```

3. **Comunicación solo vía API**
   - Frontend → Backend: HTTP/REST
   - Backend → Frontend: WebSocket (tracking)

4. **Tipos compartidos en `shared/types`**
   - Ambos pueden importar
   - Solo definiciones, sin implementación

## 📝 Actualizar Scripts

### `package.json` (root)

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:backend": "turbo run dev --filter='./backend/**'",
    "dev:frontend": "turbo run dev --filter='./frontend/**'",
    "build": "turbo run build",
    "build:backend": "turbo run build --filter='./backend/**'",
    "build:frontend": "turbo run build --filter='./frontend/**'"
  }
}
```

## 🐳 Docker Compose Actualizado

```yaml
services:
  # Backend services
  auth-service:
    build:
      context: .
      dockerfile: backend/services/auth-service/Dockerfile
  
  # Frontend
  web:
    build:
      context: .
      dockerfile: frontend/web/Dockerfile
```

## ✅ Checklist de Migración

- [ ] Crear estructura de carpetas (`backend/`, `frontend/`, `shared/`)
- [ ] Mover servicios a `backend/services/`
- [ ] Mover librerías a `backend/shared/`
- [ ] Crear `frontend/web/` con Next.js
- [ ] Crear `shared/types/` para tipos compartidos
- [ ] Actualizar `pnpm-workspace.yaml`
- [ ] Actualizar `tsconfig.base.json` con nuevos paths
- [ ] Actualizar imports en todos los archivos
- [ ] Actualizar Dockerfiles con nuevos paths
- [ ] Actualizar scripts de desarrollo
- [ ] Aplicar Clean Architecture en cada servicio
- [ ] Aplicar Clean Architecture en frontend
- [ ] Crear use cases siguiendo SOLID
- [ ] Documentar estructura final

## 🎯 Beneficios de Esta Estructura

1. **Separación Clara**: Frontend y backend completamente separados
2. **Clean Architecture**: Capas bien definidas
3. **SOLID**: Código mantenible y testeable
4. **Escalable**: Fácil agregar nuevos servicios/features
5. **Tipos Seguros**: Compartidos de forma controlada
6. **Independencia**: Cada capa puede evolucionar independientemente

