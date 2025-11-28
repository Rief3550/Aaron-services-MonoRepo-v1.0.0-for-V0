#!/bin/bash

# Script para crear los schemas en PostgreSQL
# Ejecutar después de iniciar docker-compose

set -e

echo "📊 Creando schemas en PostgreSQL..."

# Configuración de base de datos
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3307}
DB_USER=${DB_USER:-app}
DB_PASSWORD=${DB_PASSWORD:-app}
DB_NAME=${DB_NAME:-app}

# Schemas a crear
SCHEMAS=("auth" "operations" "tracking")

# Crear schemas
for schema in "${SCHEMAS[@]}"; do
    echo "  → Creando schema: $schema"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE SCHEMA IF NOT EXISTS $schema;" || {
        echo "⚠️  Error creando schema $schema. Asegúrate de que PostgreSQL esté corriendo."
        echo "   Para Docker: docker compose -f infra/docker-compose.yml up -d postgres"
    }
done

echo ""
echo "✅ Schemas creados exitosamente"
echo ""
echo "Ahora puedes ejecutar las migraciones:"
echo "  bash scripts/migrate_all.sh"

