# 🚀 Solución: Frontend No Muestra Output

## 🔍 Diagnóstico

El proceso de Next.js **SÍ está corriendo** pero:
- ❌ No muestra logs en la terminal
- ❌ No responde en el puerto 3000
- ⚠️ Probablemente está compilando o hay un error oculto

## ✅ Solución Rápida

### Paso 1: Detén el proceso actual
En la terminal donde corriste `pnpm dev`, presiona:
```
Ctrl + C
```

### Paso 2: Limpia la caché
```bash
cd frontend/web
rm -rf .next
```

### Paso 3: Reinicia con logs visibles
```bash
pnpm dev
```

**Espera 30-60 segundos**. Deberías ver algo como:
```
▲ Next.js 16.0.3
- Local:        http://localhost:3000

✓ Ready in 2.3s
```

## 🎯 O Usa el Script Automático

He creado un script que hace todo esto:

```bash
cd frontend/web
./start-dev.sh
```

## 🔍 Verificar Errores

Si sigue sin funcionar, verifica errores de compilación:

```bash
cd frontend/web
pnpm dev 2>&1 | tee dev.log
```

Luego revisa `dev.log` para ver errores.

## 📋 Checklist

- [ ] Proceso anterior detenido (Ctrl+C)
- [ ] Caché limpiada (`rm -rf .next`)
- [ ] Reiniciado (`pnpm dev`)
- [ ] Esperado 30-60 segundos
- [ ] Verificado en navegador: http://localhost:3000

## 🆘 Si Sigue Sin Funcionar

1. **Verifica dependencias**:
   ```bash
   cd frontend/web
   rm -rf node_modules
   pnpm install
   ```

2. **Verifica Node.js**:
   ```bash
   node --version  # Debe ser 20+
   ```

3. **Verifica que no haya otros procesos**:
   ```bash
   lsof -i :3000
   # Si hay procesos, mátalos:
   kill -9 $(lsof -ti:3000)
   ```

4. **Intenta en otro puerto**:
   ```bash
   pnpm dev -- -p 3001
   ```

## 📝 Nota Importante

**El silencio inicial es normal**. Next.js compila silenciosamente la primera vez. Solo espera y luego abre el navegador.

---

**¿Ya intentaste reiniciar con `Ctrl+C` y volver a correr `pnpm dev`?**

