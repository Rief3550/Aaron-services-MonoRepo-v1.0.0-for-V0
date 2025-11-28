# Setup de Turbo Repo - Guía Práctica

## Instalación Rápida

### 1. Instalar Turbo

```bash
pnpm add -D -w turbo
```

### 2. Crear `turbo.json` en la raíz

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "build/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "prisma:generate": {
      "cache": false,
      "outputs": ["**/node_modules/.prisma/**"]
    }
  }
}
```

### 3. Actualizar `package.json` (raíz)

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "prisma:generate": "turbo run prisma:generate"
  }
}
```

## Estructura con Frontend Separado

Si usas `frontend/web/`, el `turbo.json` funciona igual. Solo asegúrate de que `pnpm-workspace.yaml` incluya:

```yaml
packages:
  - 'apps/*'
  - 'frontend/*'
  - 'libs/*'
```

## Comandos Útiles

```bash
# Desarrollo (todos los servicios)
pnpm dev

# Solo frontend
pnpm --filter web dev
# o si está en frontend/web
pnpm --filter @aaron/web dev

# Build con cache
pnpm build

# Ver qué se ejecutará
pnpm turbo run build --dry-run

# Forzar rebuild (sin cache)
pnpm turbo run build --force

# Solo apps que cambiaron desde main
pnpm turbo run build --filter=...[origin/main]
```

## Remote Cache (Opcional pero Recomendado)

### Setup con Vercel (Gratis)

1. Crear cuenta en [vercel.com](https://vercel.com)
2. Instalar CLI: `pnpm add -D -w turbo`
3. Login: `pnpm turbo login`
4. Link: `pnpm turbo link`

**Beneficios:**
- Cache compartido entre todo el equipo
- Cache en CI/CD
- Builds 10-100x más rápidos

## Ejemplo de Output

### Antes (sin Turbo):
```
Building auth-service...     [2.5s]
Building operations-service... [3.1s]
Building tracking-service...  [2.8s]
Building api-gateway...       [1.9s]
Building web...               [45s]
Total: ~55 segundos
```

### Después (con Turbo + cache):
```
✓ auth-service:build (cached)     [0.1s]
✓ operations-service:build (cached) [0.1s]
✓ tracking-service:build (cached)  [0.1s]
✓ api-gateway:build (cached)       [0.1s]
✓ web:build                         [12s]  # Solo rebuilda si cambió
Total: ~12 segundos
```

## Troubleshooting

### Cache no funciona
```bash
# Limpiar cache local
pnpm turbo run build --force
```

### Dependencias no detectadas
Verifica que `dependsOn: ["^build"]` esté en `turbo.json`. El `^` significa "dependencias".

### Next.js no detecta cambios
Asegúrate de que `.next/cache/**` esté en `outputs` con `!` para excluirlo del cache.

## Próximos Pasos

1. ✅ Instalar Turbo
2. ✅ Crear `turbo.json`
3. ✅ Actualizar scripts
4. ✅ Probar: `pnpm build`
5. ⭐ (Opcional) Setup Remote Cache

