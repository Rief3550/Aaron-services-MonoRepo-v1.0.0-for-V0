#!/bin/bash

# Script para configurar archivos .env desde .env.example

set -e

echo "🔧 Configurando archivos .env..."

SERVICES=("api-gateway" "auth-service" "operations-service" "tracking-service")

for service in "${SERVICES[@]}"; do
  if [ -f "apps/$service/.env.example" ]; then
    if [ ! -f "apps/$service/.env" ]; then
      cp "apps/$service/.env.example" "apps/$service/.env"
      echo "✅ Creado apps/$service/.env"
    else
      echo "⚠️  apps/$service/.env ya existe, omitiendo..."
    fi
  else
    echo "⚠️  No se encontró apps/$service/.env.example"
  fi
done

echo ""
echo "✨ Setup completo!"
echo ""
echo "📝 IMPORTANTE: Edita los archivos .env y configura:"
echo "   - JWT secrets (deben coincidir entre servicios)"
echo "   - Database URLs (localhost:3307 para local, postgres:5432 para Docker)"
echo "   - Redis URLs (localhost:6379 para local, redis:6379 para Docker)"
echo "   - Service URLs (localhost:PORT para local, service-name:PORT para Docker)"
echo ""
echo "Ver ENV_SETUP.md para más detalles."
