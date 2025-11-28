#!/bin/bash

# Script para sincronizar schemas de Prisma con la base de datos
# Usa 'db push' que sincroniza el schema sin necesidad de archivos de migración

echo "🔄 Sincronizando schemas de Prisma con la base de datos..."

# Sincronizar Auth Service
echo "📦 Sincronizando Auth Service..."
cd backend/services/auth-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres?schema=auth" pnpm prisma db push --skip-generate
cd ../../..

# Sincronizar Operations Service  
echo "📦 Sincronizando Operations Service..."
cd backend/services/operations-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres?schema=operations" pnpm prisma db push --skip-generate
cd ../../..

# Sincronizar Tracking Service
echo "📦 Sincronizando Tracking Service..."
cd backend/services/tracking-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres?schema=tracking" pnpm prisma db push --skip-generate
cd ../../..

echo "✅ Sincronización completada!"
