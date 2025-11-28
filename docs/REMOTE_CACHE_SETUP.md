# 🚀 Setup de Remote Cache con Vercel

## 📋 Paso a Paso

### Paso 1: Crear cuenta en Vercel (si no tienes)

1. Ir a: https://vercel.com
2. Click en "Sign Up"
3. Puedes usar GitHub, GitLab, o Bitbucket
4. Completar registro

### Paso 2: Login en Turbo

```bash
pnpm turbo login
```

Esto abrirá tu navegador para autenticarte con Vercel.

### Paso 3: Link tu proyecto

```bash
pnpm turbo link
```

Esto te pedirá:
- Nombre del proyecto (ej: `aaron-backend`)
- Team (si tienes uno en Vercel)

### Paso 4: Verificar

```bash
# Probar build (debería usar remote cache)
pnpm build

# Ver cache hits
pnpm turbo run build --summarize
```

## ✅ Beneficios Inmediatos

### Local
- Primera vez: Build completo (normal)
- Siguientes builds: Solo lo que cambió
- Cache compartido entre máquinas

### CI/CD
- Si otro PR ya buildó lo mismo → usa su cache
- Builds en CI: 1-2 min en lugar de 10-15 min
- Ahorro masivo de tiempo y recursos

## 🔍 Verificar que Funciona

```bash
# Ver cache hits
pnpm turbo run build --summarize

# Ver detalles de cache
pnpm turbo run build --log-order=stream
```

Deberías ver:
```
✓ cached (remote) en los paquetes que no cambiaron
```

## 🎯 Ejemplo de Output

### Sin Remote Cache:
```
@aaron/common#build:         built in 2.3s
@aaron/auth#build:            built in 1.8s
@aaron/auth-service#build:   built in 4.2s
Total: 8.3s
```

### Con Remote Cache (segunda vez):
```
@aaron/common#build:         cached (remote) in 0.1s
@aaron/auth#build:           cached (remote) in 0.1s
@aaron/auth-service#build:   cached (remote) in 0.1s
Total: 0.3s
```

**Ahorro: 96%** 🚀

## ⚙️ Configuración Avanzada

### Variables de Entorno

Si necesitas configurar manualmente:

```bash
# En .env o shell
TURBO_TOKEN=tu_token_aqui
TURBO_TEAM=tu_team
```

### CI/CD (GitHub Actions)

```yaml
- name: Setup Turbo
  run: |
    pnpm turbo login --token ${{ secrets.TURBO_TOKEN }}
    pnpm turbo link --yes
```

## 🐛 Troubleshooting

### Error: "Not authenticated"

```bash
# Re-login
pnpm turbo login
```

### Error: "Project not linked"

```bash
# Re-link
pnpm turbo link
```

### Cache no funciona

```bash
# Verificar configuración
cat .turbo/config.json

# Limpiar cache local
rm -rf .turbo
pnpm build
```

## 📚 Recursos

- [Turbo Remote Cache Docs](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**¡Remote Cache configurado! Builds compartidos entre equipo y CI/CD** 🎉

