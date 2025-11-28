#!/bin/bash

# Script para inicializar todo el proyecto desde cero
# Ejecuta todos los pasos necesarios para arrancar el monorepo

set -e

echo "🚀 Inicializando Aaron Backend Services..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Verificar pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}⚠️  pnpm no está instalado. Instalándolo...${NC}"
  npm install -g pnpm
fi

# Paso 2: Instalar dependencias
echo -e "${GREEN}📦 Paso 1/7: Instalando dependencias...${NC}"
pnpm install

# Paso 3: Configurar .env
echo -e "${GREEN}📝 Paso 2/7: Configurando variables de entorno...${NC}"
pnpm env:setup || echo "⚠️  Algunos .env ya existen, continuando..."

# Paso 4: Verificar Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️  Docker no está instalado. Necesitas Docker para PostgreSQL y Redis.${NC}"
  exit 1
fi

# Paso 5: Levantar PostgreSQL y Redis
echo -e "${GREEN}🐳 Paso 3/7: Levantando PostgreSQL y Redis...${NC}"
docker compose -f infra/docker-compose.yml up -d postgres redis

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

# Paso 6: Crear schemas
echo -e "${GREEN}🗄️  Paso 4/7: Creando schemas en PostgreSQL...${NC}"
pnpm schemas:create

# Paso 7: Generar Prisma Clients
echo -e "${GREEN}🔧 Paso 5/7: Generando Prisma Clients...${NC}"
pnpm prisma:generate

# Paso 8: Ejecutar migraciones
echo -e "${GREEN}📊 Paso 6/7: Ejecutando migraciones de Prisma...${NC}"
pnpm migrate:all

echo ""
echo -e "${GREEN}✅ Inicialización completada!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica los archivos .env en cada servicio (apps/*/.env)"
echo "   2. Arranca los servicios en terminales separadas:"
echo "      - pnpm --filter @aaron/auth-service dev"
echo "      - pnpm --filter @aaron/operations-service dev"
echo "      - pnpm --filter @aaron/tracking-service dev"
echo "      - pnpm --filter @aaron/api-gateway dev"
echo ""
echo "   3. Verifica que todo funciona:"
echo "      curl http://localhost:3000/health"
echo ""

