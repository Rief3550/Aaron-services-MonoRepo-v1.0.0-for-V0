#!/usr/bin/env bash

set -euo pipefail

echo "🔄 Ejecutando migraciones de Prisma en todos los servicios..."
echo ""

for svc in auth-service operations-service tracking-service; do
  if [ -d "apps/$svc" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Migrando $svc"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    pushd "apps/$svc" >/dev/null
    
    if [ ! -f "prisma/schema.prisma" ]; then
      echo "  ⚠️  No se encontró prisma/schema.prisma en $svc"
      popd >/dev/null
      continue
    fi
    
    echo "  → Ejecutando: npx prisma migrate dev --name init"
    npx prisma migrate dev --name init || {
      echo "  ❌ Error en migrate dev para $svc"
      popd >/dev/null
      continue
    }
    
    echo "  → Ejecutando: npx prisma generate"
    npx prisma generate || {
      echo "  ❌ Error en prisma generate para $svc"
      popd >/dev/null
      continue
    }
    
    echo "  ✅ $svc migrado correctamente"
    popd >/dev/null
    echo ""
  else
    echo "  ⚠️  apps/$svc no existe (saltando)"
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todas las migraciones completadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
