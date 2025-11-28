# Quality Pipelines

Este documento describe los pipelines de calidad implementados en el monorepo.

## 1. ESLint + Prettier

### Configuración

**`.eslintrc.json`**: Configuración estricta de ESLint
- TypeScript parser con type checking
- Reglas recomendadas de TypeScript
- Import ordering y linting
- Integración con Prettier

**`.prettierrc.json`**: Formato de código
- Single quotes
- 2 espacios
- Semicolons
- Print width: 100

### Comandos

```bash
# Lint todos los archivos
pnpm lint

# Lint y auto-fix
pnpm lint:fix

# Verificar formato
pnpm format:check

# Formatear todos los archivos
pnpm format
```

## 2. TypeScript Config Estricto

**`tsconfig.base.json`** incluye:
- `strict: true` + todas las opciones estrictas
- `noUnusedLocals`, `noUnusedParameters`
- `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`

### Comando

```bash
# Type check sin compilar
pnpm typecheck
```

## 3. Husky + lint-staged

### Setup

```bash
# Instalar Husky
pnpm install husky --save-dev

# Inicializar Husky
pnpm prepare
```

**`.husky/pre-commit`**: Ejecuta `lint-staged` antes de cada commit.

**`.lintstagedrc.json`**: Configuración
- `.ts, .tsx`: ESLint + Prettier
- `.json, .md, .yml`: Prettier

### Comportamiento

Antes de cada commit, se ejecuta:
1. ESLint (auto-fix) en archivos TypeScript modificados
2. Prettier en archivos modificados
3. Si hay errores no corregibles, el commit se aborta

## 4. Jest Unit & E2E Tests

### Configuración por Servicio

Cada servicio tiene `jest.config.js`:
- `ts-jest` preset
- Module name mapping para `@aaron/*` libs
- Coverage reports
- Separate `spec` (unit) y `e2e` (integration) tests

### Estructura de Tests

```
apps/[service]/src/
  ├── services/
  │   ├── my.service.ts
  │   └── my.service.spec.ts        # Unit test
  └── __tests__/
      └── e2e/
          └── auth.e2e.test.ts      # E2E test
```

### Comandos

```bash
# Ejecutar todos los tests
pnpm test

# Solo unit tests
pnpm test:unit

# Solo E2E tests
pnpm test:e2e

# Con coverage
pnpm test:coverage
```

### Ejemplo de Unit Test

```typescript
// apps/auth-service/src/services/auth.service.spec.ts
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should create a new user', async () => {
    const result = await AuthService.signup({
      email: 'test@example.com',
      password: 'password123',
    });
    
    expect(result._tag).toBe('ok');
  });
});
```

### Ejemplo de E2E Test

```typescript
// apps/auth-service/src/__tests__/e2e/auth.e2e.test.ts
import request from 'supertest';
import { app } from '../../main';

describe('Auth E2E', () => {
  it('POST /auth/signup should create user', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## 5. GitHub Actions CI

### Workflow: `.github/workflows/ci.yml`

#### Jobs:

1. **lint-and-format**
   - ESLint
   - Prettier check
   - TypeScript type check

2. **prisma-format**
   - Valida formato de todos los schemas Prisma
   - `prisma format` para cada servicio

3. **build**
   - `pnpm install --frozen-lockfile`
   - `pnpm prisma:generate`
   - Build todos los apps

4. **docker-build-smoke**
   - Build Docker images para todos los servicios
   - Verifica que los Dockerfiles sean válidos
   - Usa cache de GitHub Actions

5. **test**
   - Unit tests
   - Coverage reports

### Triggers

- Push a `main` o `develop`
- Pull requests a `main` o `develop`

## 6. Smoke E2E Local

Script completo que prueba el flujo end-to-end del sistema.

### Ubicación

`scripts/smoke_e2e.sh`

### Flujo Probado

1. **Auth Flow**
   - `POST /auth/signup` - Crear usuario
   - Mock verification (set `isEmailVerified=true`)
   - `POST /auth/signin` - Login y obtener tokens

2. **Operations Flow**
   - `POST /ops/plans` - Crear plan
   - `POST /ops/subscriptions` - Crear suscripción
   - `POST /ops/work-orders` - Crear orden de trabajo

3. **Crew Assignment**
   - `POST /ops/crews` - Crear cuadrilla (o usar existente)
   - `POST /ops/work-orders/:id/assign` - Asignar cuadrilla
   - `PATCH /ops/work-orders/:id/state` - Cambiar a `en_camino`
     - Esto emite evento a Redis Pub/Sub
     - Tracking service debería recibir evento

4. **Tracking Flow**
   - Simular WebSocket connection (log only)
   - `POST /track/ping` - Enviar ping de ubicación
   - `PATCH /ops/work-orders/:id/state` - Cambiar a `visitada_finalizada`

### Uso

```bash
# Asegúrate de que todos los servicios estén corriendo
pnpm dev

# En otra terminal
pnpm smoke:e2e

# O con URLs personalizadas
GATEWAY_URL=http://localhost:3000 \
OPS_URL=http://localhost:3002 \
pnpm smoke:e2e
```

### Requisitos

- Todos los servicios deben estar corriendo
- PostgreSQL y Redis deben estar disponibles
- Variables de entorno configuradas

### Salida Esperada

```
[SMOKE] Checking services...
[SMOKE] ✅ API Gateway is running
[SMOKE] ✅ Auth Service is running
[SMOKE] Step 1: Auth Flow (signup → verify → signin)
[SMOKE] ✅ Signup successful
[SMOKE] ✅ Signin successful
[SMOKE] Step 2: Operations (plan → subscription → order)
[SMOKE] ✅ Plan created
[SMOKE] ✅ Subscription created
[SMOKE] ✅ Work order created
[SMOKE] Step 3: Assign crew → change to en_camino
[SMOKE] ✅ Crew assigned
[SMOKE] ✅ Order state changed to en_camino
[SMOKE] Step 4: Tracking (WebSocket → ping → finalize)
[SMOKE] ✅ Ping sent successfully
[SMOKE] ✅ Order finalized
[SMOKE] 🎉 Smoke E2E Test Completed!
```

## Comandos Rápidos

```bash
# Pre-commit (automático vía Husky)
git commit -m "..."  # Ejecuta lint-staged

# Desarrollo
pnpm dev              # Iniciar todos los servicios
pnpm lint             # Lint
pnpm format           # Formatear código
pnpm typecheck        # Verificar tipos

# Testing
pnpm test             # Todos los tests
pnpm test:unit         # Solo unit
pnpm test:e2e          # Solo E2E
pnpm test:coverage    # Con coverage
pnpm smoke:e2e        # Smoke test completo

# CI/CD
pnpm build            # Build todos los apps
pnpm prisma:format     # Validar schemas Prisma
```

## Mejores Prácticas

1. **Commit frecuente**: Husky valida código antes de commit
2. **Tests locales**: Ejecutar `pnpm test` antes de push
3. **Type safety**: Usar `pnpm typecheck` para verificar tipos
4. **Smoke test**: Ejecutar `pnpm smoke:e2e` después de cambios importantes
5. **Coverage**: Mantener cobertura > 70% en código crítico

## Troubleshooting

### ESLint errors

```bash
# Auto-fix
pnpm lint:fix

# Ver errores específicos
pnpm lint --format=stylish
```

### Prettier conflicts

```bash
# Formatear todo
pnpm format
```

### Jest not finding modules

Verificar `moduleNameMapper` en `jest.config.js` de cada servicio.

### Husky no ejecuta

```bash
pnpm prepare  # Reinstalar hooks
```

### Smoke test falla

- Verificar que todos los servicios estén corriendo
- Verificar variables de entorno
- Revisar logs de los servicios

