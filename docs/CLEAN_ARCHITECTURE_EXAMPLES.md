# Ejemplos Prácticos: Clean Architecture + SOLID

## 📚 Índice

1. [Backend: Auth Service](#backend-auth-service)
2. [Frontend: Login Feature](#frontend-login-feature)
3. [Tipos Compartidos](#tipos-compartidos)
4. [Testing con Clean Architecture](#testing)

---

## Backend: Auth Service

### Estructura Completa

```
backend/services/auth-service/src/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── role.entity.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── role.repository.ts
│   └── value-objects/
│       ├── email.vo.ts
│       └── password.vo.ts
│
├── application/
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── signup.use-case.ts
│   │   │   ├── signin.use-case.ts
│   │   │   └── refresh-token.use-case.ts
│   │   └── users/
│   │       └── create-user.use-case.ts
│   └── dto/
│       └── signup.dto.ts
│
├── infrastructure/
│   ├── persistence/
│   │   └── prisma/
│   │       ├── user.repository.ts
│   │       └── role.repository.ts
│   ├── external/
│   │   ├── email/
│   │   │   └── resend-email.service.ts
│   │   └── jwt/
│   │       └── jwt.service.ts
│   └── config/
│       └── database.config.ts
│
└── presentation/
    ├── controllers/
    │   ├── auth.controller.ts
    │   └── users.controller.ts
    └── dto/
        └── signup-request.dto.ts
```

### Ejemplo 1: Domain Layer

#### `domain/entities/user.entity.ts`

```typescript
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly fullName: string,
    public readonly passwordHash: string,
    public readonly isEmailVerified: boolean,
    public readonly roles: Role[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    email: string,
    fullName: string,
    passwordHash: string
  ): User {
    return new User(
      crypto.randomUUID(),
      Email.create(email),
      fullName,
      passwordHash,
      false,
      [],
      new Date(),
      new Date()
    );
  }

  verifyEmail(): User {
    return new User(
      this.id,
      this.email,
      this.fullName,
      this.passwordHash,
      true, // verified
      this.roles,
      this.createdAt,
      new Date()
    );
  }

  addRole(role: Role): User {
    if (this.roles.some(r => r.id === role.id)) {
      return this; // Ya tiene el rol
    }
    
    return new User(
      this.id,
      this.email,
      this.fullName,
      this.passwordHash,
      this.isEmailVerified,
      [...this.roles, role],
      this.createdAt,
      new Date()
    );
  }
}
```

#### `domain/value-objects/email.vo.ts`

```typescript
export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }

  static create(email: string): Email {
    return new Email(email);
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### `domain/repositories/user.repository.ts`

```typescript
import { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### Ejemplo 2: Application Layer (Use Cases)

#### `application/use-cases/auth/signup.use-case.ts`

```typescript
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { EmailService } from '../../../domain/services/email.service';
import { PasswordHasher } from '../../../domain/services/password-hasher.service';
import { SignupDto } from '../dto/signup.dto';
import { Result } from '@aaron/common';

export class SignupUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(dto: SignupDto): Promise<Result<User>> {
    try {
      // 1. Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        return Result.error(new Error('User already exists'));
      }

      // 2. Hashear password
      const passwordHash = await this.passwordHasher.hash(dto.password);

      // 3. Crear usuario (domain entity)
      const user = User.create(dto.email, dto.fullName, passwordHash);

      // 4. Guardar usuario
      const savedUser = await this.userRepository.save(user);

      // 5. Enviar email de verificación
      await this.emailService.sendVerificationEmail(savedUser);

      return Result.ok(savedUser);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Signup failed'));
    }
  }
}
```

#### `application/use-cases/auth/signin.use-case.ts`

```typescript
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordHasher } from '../../../domain/services/password-hasher.service';
import { JwtService } from '../../../domain/services/jwt.service';
import { SigninDto } from '../dto/signin.dto';
import { Result } from '@aaron/common';

export interface SigninResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class SigninUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService
  ) {}

  async execute(dto: SigninDto): Promise<Result<SigninResult>> {
    try {
      // 1. Buscar usuario
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        return Result.error(new Error('Invalid credentials'));
      }

      // 2. Verificar password
      const isValid = await this.passwordHasher.verify(
        dto.password,
        user.passwordHash
      );
      if (!isValid) {
        return Result.error(new Error('Invalid credentials'));
      }

      // 3. Generar tokens
      const accessToken = await this.jwtService.generateAccessToken(user);
      const refreshToken = await this.jwtService.generateRefreshToken(user);

      return Result.ok({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Signin failed'));
    }
  }
}
```

### Ejemplo 3: Infrastructure Layer

#### `infrastructure/persistence/prisma/user.repository.ts`

```typescript
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PrismaClient } from '@prisma/client';
import { UserMapper } from '../mappers/user.mapper';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    return data ? UserMapper.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    return data ? UserMapper.toDomain(data) : null;
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    
    const saved = await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
      include: { roles: true },
    });

    return UserMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
```

#### `infrastructure/external/email/resend-email.service.ts`

```typescript
import { EmailService } from '../../../domain/services/email.service';
import { User } from '../../../domain/entities/user.entity';
import { Resend } from 'resend';

export class ResendEmailService implements EmailService {
  constructor(private readonly resend: Resend) {}

  async sendVerificationEmail(user: User): Promise<void> {
    const token = this.generateVerificationToken(user);
    
    await this.resend.emails.send({
      from: 'noreply@aaron.com',
      to: user.email.getValue(),
      subject: 'Verify your email',
      html: this.getVerificationEmailTemplate(user, token),
    });
  }

  private generateVerificationToken(user: User): string {
    // Lógica de generación de token
    return crypto.randomUUID();
  }

  private getVerificationEmailTemplate(user: User, token: string): string {
    return `
      <h1>Verify your email</h1>
      <p>Hi ${user.fullName},</p>
      <p>Click <a href="${process.env.APP_URL}/verify?token=${token}">here</a> to verify your email.</p>
    `;
  }
}
```

### Ejemplo 4: Presentation Layer

#### `presentation/controllers/auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { SignupUseCase } from '../../application/use-cases/auth/signup.use-case';
import { SigninUseCase } from '../../application/use-cases/auth/signin.use-case';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SigninRequestDto } from './dto/signin-request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly signinUseCase: SigninUseCase
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupRequestDto) {
    const result = await this.signupUseCase.execute({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    });

    if (result.isError()) {
      throw result.error;
    }

    return {
      user: result.value,
      message: 'User created successfully',
    };
  }

  @Post('signin')
  async signin(@Body() dto: SigninRequestDto) {
    const result = await this.signinUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    if (result.isError()) {
      throw result.error;
    }

    return result.value;
  }
}
```

---

## Frontend: Login Feature

### Estructura

```
frontend/web/src/
├── domain/
│   └── entities/
│       └── user.entity.ts
│
├── application/
│   ├── use-cases/
│   │   └── auth/
│   │       └── login.use-case.ts
│   └── services/
│       └── auth.service.ts
│
├── infrastructure/
│   ├── api/
│   │   └── auth-api-client.ts
│   └── storage/
│       └── token-storage.ts
│
└── presentation/
    ├── hooks/
    │   └── use-auth.ts
    └── components/
        └── login-form.tsx
```

### Ejemplo Completo

#### `domain/entities/user.entity.ts`

```typescript
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly roles: string[]
  ) {}

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}
```

#### `application/use-cases/auth/login.use-case.ts`

```typescript
import { User } from '../../../domain/entities/user.entity';
import { AuthApiClient } from '../../../infrastructure/api/auth-api-client';
import { TokenStorage } from '../../../infrastructure/storage/token-storage';

export interface LoginDto {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly authApi: AuthApiClient,
    private readonly tokenStorage: TokenStorage
  ) {}

  async execute(dto: LoginDto): Promise<User> {
    // 1. Llamar API
    const response = await this.authApi.login(dto);

    // 2. Guardar token
    await this.tokenStorage.saveAccessToken(response.accessToken);
    await this.tokenStorage.saveRefreshToken(response.refreshToken);

    // 3. Retornar entidad de dominio
    return new User(
      response.user.id,
      response.user.email,
      response.user.fullName,
      response.user.roles
    );
  }
}
```

#### `infrastructure/api/auth-api-client.ts`

```typescript
import { LoginDto } from '../../application/use-cases/auth/login.use-case';
import { AuthResponse } from '@shared/types/api/auth';

export interface IAuthApiClient {
  login(dto: LoginDto): Promise<AuthResponse>;
}

export class AuthApiClient implements IAuthApiClient {
  constructor(private readonly baseUrl: string) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }
}
```

#### `presentation/hooks/use-auth.ts`

```typescript
import { useState } from 'react';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { User } from '../../domain/entities/user.entity';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loginUseCase = new LoginUseCase(/* DI */);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const loggedUser = await loginUseCase.execute({ email, password });
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { user, login, loading, error };
}
```

---

## Tipos Compartidos

### `shared/types/src/api/auth/signup.dto.ts`

```typescript
export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
}
```

### Uso en Backend

```typescript
import { SignupRequest } from '@shared/types/api/auth';

@Post('signup')
async signup(@Body() dto: SignupRequest) {
  // dto está tipado
}
```

### Uso en Frontend

```typescript
import { SigninRequest } from '@shared/types/api/auth';

const login = async (dto: SigninRequest) => {
  // dto está tipado
};
```

---

## Testing

### Test de Use Case (Backend)

```typescript
describe('SignupUseCase', () => {
  let useCase: SignupUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as any;

    emailService = {
      sendVerificationEmail: jest.fn(),
    } as any;

    passwordHasher = {
      hash: jest.fn(),
    } as any;

    useCase = new SignupUseCase(
      userRepository,
      emailService,
      passwordHasher
    );
  });

  it('should create user successfully', async () => {
    // Arrange
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');
    const savedUser = User.create('test@test.com', 'Test User', 'hashed-password');
    userRepository.save.mockResolvedValue(savedUser);

    // Act
    const result = await useCase.execute({
      email: 'test@test.com',
      password: 'password123',
      fullName: 'Test User',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    expect(userRepository.save).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });
});
```

---

## 🎯 Principios Aplicados

### ✅ Single Responsibility
- Cada clase tiene una sola razón para cambiar
- Use cases solo orquestan, no implementan

### ✅ Open/Closed
- Repositorios son interfaces, fáciles de extender
- Nuevos providers sin modificar código existente

### ✅ Liskov Substitution
- Cualquier implementación de `UserRepository` funciona
- Tests usan implementaciones mock

### ✅ Interface Segregation
- Interfaces pequeñas y específicas
- No forzar implementaciones innecesarias

### ✅ Dependency Inversion
- Dependencias de abstracciones, no implementaciones
- Fácil testing y mantenimiento

