#!/usr/bin/env bash

# Restore a Postgres dump (custom/tar format) into a target database.
# Defaults are aligned with local dev: user root, password devAS.team, db aaron_services.

set -euo pipefail

DB_HOST="${DB_HOST:-host.docker.internal}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-devAS.team}"
DB_NAME="${DB_NAME:-aaron_services}"
DUMP_PATH="${DUMP_PATH:-$(dirname "$0")/postgres_backup.dump}"

export PGPASSWORD="$DB_PASSWORD"

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "❌ pg_restore no está instalado. Instálalo (en mac: brew install libpq) y vuelve a intentar." >&2
  exit 1
fi

if ! [ -f "$DUMP_PATH" ]; then
  echo "❌ No se encontró el dump en: $DUMP_PATH" >&2
  exit 1
fi

echo "🗄️  Restaurando dump en PostgreSQL"
echo "    Host: $DB_HOST  Puerto: $DB_PORT"
echo "    Usuario: $DB_USER  Base: $DB_NAME"
echo "    Dump: $DUMP_PATH"

# Crear la base si no existe (silencio errores si ya existe)
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true

# Restaurar ignorando owners/privilegios del dump y limpiando objetos previos
pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$DUMP_PATH"

echo "✅ Restore completado"
