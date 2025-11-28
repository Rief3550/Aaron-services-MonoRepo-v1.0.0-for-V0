# 🔧 Troubleshooting del Frontend

## ❓ El comando `pnpm dev` no muestra nada

Esto es **normal** en Next.js. El servidor está compilando silenciosamente. Espera unos segundos (30-60 segundos en la primera vez).

### ¿Cómo saber si está funcionando?

1. **Espera 30-60 segundos** después de correr `pnpm dev`
2. **Abre tu navegador** en: http://localhost:3000
3. **Verifica en otra terminal** si el puerto está en uso:
   ```bash
   lsof -i :3000
   ```

### Ver logs detallados

Corre Next.js en modo verbose:

```bash
cd frontend/web
NODE_OPTIONS='--inspect' pnpm dev
```

O agrega el flag `--debug`:

```bash
pnpm dev --debug
```

## 🔍 Verificar que está corriendo

### Opción 1: Abrir el navegador
Abre http://localhost:3000 en tu navegador. Si aparece algo (aunque sea un error), el servidor está corriendo.

### Opción 2: Verificar puerto
```bash
lsof -i :3000
# o
netstat -an | grep 3000
```

### Opción 3: Cambiar puerto
Si el puerto 3000 está ocupado, usa otro:

```bash
pnpm dev -- -p 3001
```

O crea un archivo `.env.local`:
```env
PORT=3001
```

## 🐛 Errores Comunes

### Error: Port 3000 is already in use
**Solución**: 
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# O usar otro puerto
pnpm dev -- -p 3001
```

### Error: Cannot find module
**Solución**: 
```bash
cd frontend/web
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Error: EADDRINUSE
**Solución**: El puerto está ocupado, cambia el puerto o mata el proceso.

### El servidor se queda colgado
**Solución**:
1. Presiona `Ctrl+C` para detenerlo
2. Limpia la caché:
   ```bash
   rm -rf .next
   ```
3. Reinstala dependencias:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
4. Intenta de nuevo:
   ```bash
   pnpm dev
   ```

## ✅ Verificar que funciona

Una vez que Next.js termine de compilar, deberías ver:

```
✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 1.2s
```

Y luego:
```
  ▲ Next.js 16.0.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

## 🔗 URLs Importantes

- **Frontend**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard

## 📝 Notas

- **Primera vez**: La compilación puede tardar 1-2 minutos
- **Siguientes veces**: Debería ser más rápido (10-30 segundos)
- **Hot reload**: Next.js recarga automáticamente cuando cambias archivos

## 🆘 Si nada funciona

1. **Limpia todo**:
   ```bash
   cd frontend/web
   rm -rf .next node_modules
   pnpm install
   pnpm dev
   ```

2. **Verifica Node.js**:
   ```bash
   node --version  # Debe ser 20+
   ```

3. **Verifica pnpm**:
   ```bash
   pnpm --version
   ```

