#!/usr/bin/env bash

# Script para migrar estructura actual a nueva estructura
# backend/ frontend/ shared/

set -e

echo "🚀 Iniciando migración de estructura..."

# Crear nuevas carpetas
echo "📁 Creando estructura de carpetas..."
mkdir -p backend/services
mkdir -p backend/shared
mkdir -p frontend/web
mkdir -p shared/types/src

# Mover servicios backend
echo "📦 Moviendo servicios backend..."
if [ -d "apps/api-gateway" ]; then
  mv apps/api-gateway backend/services/
  echo "  ✓ api-gateway movido"
fi

if [ -d "apps/auth-service" ]; then
  mv apps/auth-service backend/services/
  echo "  ✓ auth-service movido"
fi

if [ -d "apps/operations-service" ]; then
  mv apps/operations-service backend/services/
  echo "  ✓ operations-service movido"
fi

if [ -d "apps/tracking-service" ]; then
  mv apps/tracking-service backend/services/
  echo "  ✓ tracking-service movido"
fi

# Mover librerías backend
echo "📚 Moviendo librerías backend..."
if [ -d "libs/common" ]; then
  mv libs/common backend/shared/
  echo "  ✓ common movido"
fi

if [ -d "libs/auth" ]; then
  mv libs/auth backend/shared/
  echo "  ✓ auth movido"
fi

if [ -d "libs/mail" ]; then
  mv libs/mail backend/shared/
  echo "  ✓ mail movido"
fi

if [ -d "libs/prisma" ]; then
  mv libs/prisma backend/shared/
  echo "  ✓ prisma movido"
fi

# Eliminar carpetas vacías
echo "🧹 Limpiando carpetas vacías..."
rmdir apps 2>/dev/null || true
rmdir libs 2>/dev/null || true

echo ""
echo "✅ Migración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Actualizar pnpm-workspace.yaml"
echo "  2. Actualizar tsconfig.base.json con nuevos paths"
echo "  3. Actualizar imports en todos los archivos"
echo "  4. Actualizar Dockerfiles"
echo "  5. Revisar scripts de desarrollo"
echo ""
echo "Ver docs/ARCHITECTURE_RESTRUCTURE.md para más detalles"

