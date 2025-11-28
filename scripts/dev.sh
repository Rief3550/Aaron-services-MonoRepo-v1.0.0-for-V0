#!/usr/bin/env bash

set -e

# Crear archivo .env con todas las variables de entorno necesarias
cat > /app/.env <<EOF
DATABASE_URL=${DATABASE_URL}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_URL=${REDIS_URL:-redis://redis:6379}
NODE_ENV=${NODE_ENV:-development}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-15m}
JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN:-7d}
RESEND_API_KEY=${RESEND_API_KEY}
MAIL_FROM=${MAIL_FROM}
AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://localhost:3001}
OPERATIONS_SERVICE_URL=${OPERATIONS_SERVICE_URL:-http://localhost:3002}
TRACKING_SERVICE_URL=${TRACKING_SERVICE_URL:-http://localhost:3003}
EOF

echo "✅ Variables de entorno configuradas en /app/.env"

# Iniciar todos los servicios en paralelo
PORT=3100 pnpm --filter @aaron/web dev &
pnpm --filter @aaron/auth-service start &
pnpm --filter @aaron/operations-service start &
pnpm --filter @aaron/tracking-service start &
pnpm --filter @aaron/api-gateway start

# Esperar a que todos los procesos terminen
wait
