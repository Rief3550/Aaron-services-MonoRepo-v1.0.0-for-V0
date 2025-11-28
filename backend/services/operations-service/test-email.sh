#!/bin/bash

# Script para probar el envío de email de activación
# Uso: ./test-email.sh [TOKEN_ADMIN]

TOKEN=${1:-""}
EMAIL="fede.riera7@gmail.com"
NOMBRE="Federico Riera"
PLAN="Plan Departamento"

if [ -z "$TOKEN" ]; then
  echo "⚠️  Error: Necesitas proporcionar un token de admin"
  echo "Uso: ./test-email.sh TU_TOKEN_ADMIN"
  echo ""
  echo "Para obtener un token:"
  echo "curl -X POST http://localhost:3100/auth/signin -H 'Content-Type: application/json' -d '{\"email\":\"admin@test.com\",\"password\":\"Admin123!\"}'"
  exit 1
fi

echo "📧 Enviando email de activación a $EMAIL..."
echo ""

RESPONSE=$(curl -s -X POST "http://localhost:3100/ops/test-email/activation" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"nombreCompleto\": \"$NOMBRE\",
    \"planNombre\": \"$PLAN\"
  }")

echo "Respuesta del servidor:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Email enviado correctamente!"
  echo "📬 Revisa tu bandeja de entrada en $EMAIL"
else
  echo ""
  echo "❌ Error al enviar el email"
fi


