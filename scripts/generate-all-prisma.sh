#!/bin/bash

# Script para generar todos los Prisma Clients

set -e

echo "🔧 Generando Prisma Clients en todos los servicios..."

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm no está instalado. Por favor instálalo primero."
    exit 1
fi

# Servicios que usan Prisma
SERVICES=("auth-service" "operations-service" "tracking-service")

for service in "${SERVICES[@]}"; do
    if [ -d "backend/services/$service/prisma" ]; then
        echo ""
        echo "📦 Generando Prisma Client para $service..."
        cd "backend/services/$service"
        
        if [ -f "prisma/schema.prisma" ]; then
            pnpm prisma generate || echo "  ⚠️  Error al generar Prisma Client en $service"
        else
            echo "  ⚠️  No se encontró schema.prisma en $service"
        fi
        
        cd ../../..
    else
        echo "⚠️  No se encontró directorio prisma en $service"
    fi
done

echo ""
echo "✅ Prisma Clients generados"

