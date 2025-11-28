#!/bin/sh
set -e

echo "🚀 Starting Aaron Services..."

# Detección automática de entorno Docker para corregir host de Redis
if [ -f /.dockerenv ]; then
    echo "🐳 Detectado entorno Docker"
    if [ "$REDIS_HOST" = "localhost" ] || [ "$REDIS_HOST" = "127.0.0.1" ] || [ -z "$REDIS_HOST" ]; then
        echo "⚠️  REDIS_HOST estaba configurado como '$REDIS_HOST' dentro de Docker."
        echo "🔄 Cambiando automáticamente a 'redis' para permitir conexión entre contenedores."
        export REDIS_HOST=redis
    fi
    
    # Esperar a que Redis esté disponible (resolución DNS)
    echo "⏳ Esperando a que el host '$REDIS_HOST' sea visible..."
    MAX_RETRIES=30
    COUNT=0
    while ! ping -c 1 "$REDIS_HOST" > /dev/null 2>&1; do
        if [ $COUNT -ge $MAX_RETRIES ]; then
            echo "❌ Timeout esperando a Redis ($REDIS_HOST)."
            # No salimos con error, intentamos continuar por si acaso ping está bloqueado pero TCP funciona
            break
        fi
        echo "   ...esperando a $REDIS_HOST (intento $COUNT/$MAX_RETRIES)"
        sleep 1
        COUNT=$((COUNT+1))
    done
    echo "✅ Host '$REDIS_HOST' es visible o tiempo de espera agotado. Continuando."
fi

# Start Microservices in background with correct ports
echo "Starting Auth Service..."
if [ -z "$JWT_SECRET" ]; then echo "❌ JWT_SECRET is missing in start-all.sh"; else echo "✅ JWT_SECRET is present"; fi
PORT="${AUTH_SERVICE_PORT:-3001}" \
DATABASE_URL="${DATABASE_URL}?schema=auth" \
JWT_ACCESS_SECRET="${JWT_SECRET}" \
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}" \
JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN:-7d}" \
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
GOOGLE_CALLBACK_URL="${GOOGLE_CALLBACK_URL}" \
RESEND_API_KEY="${RESEND_API_KEY}" \
  node backend/services/auth-service/dist/services/auth-service/src/main.js &

echo "Starting Operations Service..."
echo "DEBUG: REDIS_HOST is ${REDIS_HOST}"
PORT="${OPERATIONS_SERVICE_PORT:-3002}" \
DATABASE_URL="${DATABASE_URL}?schema=operations" \
RESEND_API_KEY="${RESEND_API_KEY}" \
REDIS_HOST="${REDIS_HOST:-redis}" \
REDIS_PORT="${REDIS_PORT:-6379}" \
  node backend/services/operations-service/dist/services/operations-service/src/main.js &

echo "Starting Tracking Service..."
echo "DEBUG: REDIS_HOST is ${REDIS_HOST}"
PORT="${TRACKING_SERVICE_PORT:-3003}" \
DATABASE_URL="${DATABASE_URL}?schema=tracking" \
REDIS_HOST="${REDIS_HOST:-redis}" \
REDIS_PORT="${REDIS_PORT:-6379}" \
  node backend/services/tracking-service/dist/services/tracking-service/src/main.js &

# Wait for services to be ready (optional, but good practice)
sleep 5

# Serve frontend
if [ -f "/app/backend/services/api-gateway/client/index.html" ]; then
  echo "Static frontend detected at /app/backend/services/api-gateway/client - served by API Gateway. Skipping Next.js server."
else
  echo "Starting Next.js Frontend Server..."
  cd frontend/web && PORT=3100 node_modules/.bin/next start &
  cd /app
fi

# Start API Gateway (Foreground process)
echo "Starting API Gateway..."
PORT="${API_GATEWAY_PORT:-3000}" exec node backend/services/api-gateway/dist/main.js
