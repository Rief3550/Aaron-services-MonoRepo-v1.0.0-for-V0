#!/bin/bash

# Script para levantar todo el sistema con Docker

echo "🚀 Levantando Sistema Aaron con Docker"
echo "========================================"
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

echo "✅ Docker está corriendo"
echo ""

# Verificar PostgreSQL local
echo "🔍 Verificando PostgreSQL local..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL local está corriendo"
else
    echo "⚠️  PostgreSQL local no detectado"
    echo "   Los servicios se conectarán a host.docker.internal:5432"
fi
echo ""

# Habilitar BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🔨 Buildeando imágenes..."
echo "   (Esto puede tomar varios minutos la primera vez)"
echo ""

# Build
docker compose build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error en el build. Revisa los logs arriba."
    exit 1
fi

echo ""
echo "✅ Build completado"
echo ""
echo "🚀 Levantando servicios..."
echo ""

# Up
docker compose up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al levantar servicios."
    exit 1
fi

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 5

echo ""
echo "📊 Estado de los servicios:"
echo ""
docker compose ps

echo ""
echo "🎉 ¡Sistema levantado!"
echo ""
echo "📋 Servicios disponibles:"
echo "   • API Gateway:         http://localhost:3000"
echo "   • Auth Service:        http://localhost:3001"
echo "   • Operations Service:  http://localhost:3002"
echo "   • Tracking Service:    http://localhost:3003"
echo "   • Redis:               localhost:6379"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs:      docker compose logs -f"
echo "   • Detener:       docker compose stop"
echo "   • Reiniciar:     docker compose restart"
echo "   • Ver estado:    docker compose ps"
echo ""
echo "📚 Documentación: docs/DOCKER_COMPLETE_GUIDE.md"

