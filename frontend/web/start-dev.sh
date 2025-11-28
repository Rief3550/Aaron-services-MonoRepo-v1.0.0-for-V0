#!/bin/bash

# Script para iniciar el frontend con logs visibles

echo "🧹 Limpiando caché de Next.js..."
rm -rf .next

echo "🚀 Iniciando Next.js en modo desarrollo..."
echo "📍 El servidor estará disponible en: http://localhost:3000"
echo ""
echo "Espera 30-60 segundos para que compile..."
echo ""

pnpm dev

