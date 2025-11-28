# @aaron/prisma

Biblioteca de Prisma para el monorepo.

## Nota Importante

**Cada servicio tiene su propio Prisma Client.**

En este monorepo, cada servicio de aplicación (`auth-service`, `operations-service`, `tracking-service`) tiene su propio directorio `prisma/` y genera su propio Prisma Client.

**No uses un Prisma Client compartido.** Cada servicio debe:

1. Tener su propio `prisma/schema.prisma`
2. Ejecutar `npx prisma generate` en su directorio
3. Importar el cliente generado desde `./node_modules/.prisma/client` o usando `@prisma/client` local

## Estructura

```
apps/
├── auth-service/
│   └── prisma/
│       └── schema.prisma  # Schema auth
├── operations-service/
│   └── prisma/
│       └── schema.prisma  # Schema operations
└── tracking-service/
    └── prisma/
        └── schema.prisma  # Schema tracking
```

## Uso

Cada servicio importa su propio cliente:

```typescript
// En apps/auth-service/src/config/database.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

## Migraciones

Ejecutar migraciones por servicio:

```bash
cd apps/auth-service
npx prisma migrate dev --name migration_name
```

O usar el script desde la raíz:

```bash
pnpm migrate:all
```

## Schemas Separados

Este monorepo usa la estrategia de **múltiples schemas en una base de datos PostgreSQL**:

- `auth` schema para `auth-service`
- `operations` schema para `operations-service`
- `tracking` schema para `tracking-service`

Cada `schema.prisma` debe incluir:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth"]  // o "operations", "tracking"
}
```

Y cada modelo debe incluir:

```prisma
model User {
  // ...
  @@schema("auth")
}
```

