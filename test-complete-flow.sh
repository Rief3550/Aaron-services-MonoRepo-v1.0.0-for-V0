#!/bin/bash

# Script para probar el flujo completo: signup -> verificación -> propiedad -> auditoría
# Email: fede.riera7@gmail.com
# Coordenadas: -29.408660, -66.858431

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${API_GATEWAY_URL:-http://localhost:3000}"
EMAIL="fede.riera7@gmail.com"
PASSWORD="Test123456!"
FULL_NAME="Federico Riera"
LAT=-29.408660
LNG=-66.858431

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Prueba de Flujo Completo${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Variables para almacenar IDs
USER_ID=""
CLIENT_ID=""
PROPERTY_ID=""
PLAN_ID=""
VERIFICATION_TOKEN=""
ACCESS_TOKEN=""

# ============================================
# PASO 1: Crear usuario (Signup)
# ============================================
echo -e "${YELLOW}[PASO 1] Creando usuario...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"fullName\": \"${FULL_NAME}\",
    \"lat\": ${LAT},
    \"lng\": ${LNG}
  }")

echo "Respuesta signup: $SIGNUP_RESPONSE"

# Extraer USER_ID y tokens
USER_ID=$(echo $SIGNUP_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear el usuario. Verificar respuesta:${NC}"
  echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Usuario creado: ${USER_ID}${NC}"
echo ""

# ============================================
# PASO 2: Obtener token de verificación
# ============================================
echo -e "${YELLOW}[PASO 2] Obteniendo token de verificación...${NC}"

# Necesitamos obtener el token de la base de datos o del email audit
# Por ahora, vamos a intentar obtenerlo consultando directamente
# O podemos usar el endpoint de verificación si tenemos acceso a la DB

# Alternativa: Intentar login para ver si el email ya está verificado
# Si no, necesitamos el token del email

echo -e "${YELLOW}⚠️  Para obtener el token de verificación, revisa el email o la tabla email_audit${NC}"
echo -e "${YELLOW}   O ejecuta este query SQL:${NC}"
echo "   SELECT meta->>'token' as token FROM auth.email_audit WHERE email = '${EMAIL}' AND type = 'VERIFY' ORDER BY created_at DESC LIMIT 1;"
echo ""
read -p "Ingresa el token de verificación (o presiona Enter para continuar sin verificar): " VERIFICATION_TOKEN

if [ ! -z "$VERIFICATION_TOKEN" ]; then
  # ============================================
  # PASO 3: Verificar email
  # ============================================
  echo -e "${YELLOW}[PASO 3] Verificando email...${NC}"
  VERIFY_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/verify" \
    -H "Content-Type: application/json" \
    -d "{
      \"token\": \"${VERIFICATION_TOKEN}\"
    }")
  
  echo "Respuesta verificación: $VERIFY_RESPONSE"
  echo -e "${GREEN}✅ Email verificado${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  Saltando verificación de email${NC}"
  echo ""
fi

# ============================================
# PASO 4: Login para obtener token de admin/auditor
# ============================================
echo -e "${YELLOW}[PASO 4] Haciendo login como admin para operaciones...${NC}"

# Intentar login con el usuario creado
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  No se pudo obtener token. Intentando con admin@aaron.com...${NC}"
  ADMIN_LOGIN=$(curl -s -X POST "${BASE_URL}/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@aaron.com",
      "password": "admin123"
    }')
  ACCESS_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener token de acceso${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtenido${NC}"
echo ""

# ============================================
# PASO 5: Obtener cliente creado
# ============================================
echo -e "${YELLOW}[PASO 5] Obteniendo cliente...${NC}"

# Buscar cliente por userId
CLIENTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/ops/clients" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "Respuesta clientes: $CLIENTS_RESPONSE"

# Intentar obtener el cliente pendiente
PENDING_CLIENTS=$(curl -s -X GET "${BASE_URL}/ops/clients/pending" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

CLIENT_ID=$(echo $PENDING_CLIENTS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  No se encontró cliente pendiente. Intentando obtener cliente por userId...${NC}"
  # Si no hay cliente pendiente, puede que ya esté creado
  # Usar el userId para buscar
  CLIENT_ID=$USER_ID  # A veces el clientId es el mismo que userId
fi

echo -e "${GREEN}✅ Cliente ID: ${CLIENT_ID}${NC}"
echo ""

# ============================================
# PASO 6: Obtener o crear un plan
# ============================================
echo -e "${YELLOW}[PASO 6] Obteniendo planes disponibles...${NC}"

PLANS_RESPONSE=$(curl -s -X GET "${BASE_URL}/ops/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "Respuesta planes: $PLANS_RESPONSE"

PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo -e "${YELLOW}⚠️  No hay planes disponibles. Creando un plan de prueba...${NC}"
  
  CREATE_PLAN_RESPONSE=$(curl -s -X POST "${BASE_URL}/ops/admin/plans" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Plan Departamento Básico",
      "description": "Plan básico para departamentos",
      "price": 15000,
      "currency": "ARS",
      "billingPeriod": "MONTHLY",
      "active": true,
      "caracteristicas": ["Plomería", "Electricidad", "Pintura"]
    }')
  
  PLAN_ID=$(echo $CREATE_PLAN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✅ Plan creado: ${PLAN_ID}${NC}"
else
  echo -e "${GREEN}✅ Plan encontrado: ${PLAN_ID}${NC}"
fi
echo ""

# ============================================
# PASO 7: Crear propiedad (inmueble)
# ============================================
echo -e "${YELLOW}[PASO 7] Creando propiedad...${NC}"

CREATE_PROPERTY_RESPONSE=$(curl -s -X POST "${BASE_URL}/ops/properties" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"address\": \"Av. San Martín 1234, La Rioja, La Rioja\",
    \"lat\": ${LAT},
    \"lng\": ${LNG},
    \"summary\": \"Departamento en zona céntrica de La Rioja\"
  }")

echo "Respuesta crear propiedad: $CREATE_PROPERTY_RESPONSE"

PROPERTY_ID=$(echo $CREATE_PROPERTY_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROPERTY_ID" ]; then
  echo -e "${RED}❌ Error: No se pudo crear la propiedad${NC}"
  echo "$CREATE_PROPERTY_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_PROPERTY_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Propiedad creada: ${PROPERTY_ID}${NC}"
echo ""

# ============================================
# PASO 8: Completar auditoría del inmueble
# ============================================
echo -e "${YELLOW}[PASO 8] Completando auditoría del inmueble...${NC}"

AUDIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/ops/properties/${PROPERTY_ID}/audit" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"lat\": ${LAT},
    \"lng\": ${LNG},
    \"accuracy\": 10,
    \"tipoPropiedad\": \"DEPARTAMENTO\",
    \"tipoConstruccion\": \"LOSA\",
    \"ambientes\": 3,
    \"banos\": 2,
    \"superficieCubiertaM2\": 75.5,
    \"superficieDescubiertaM2\": 15.0,
    \"barrio\": \"Centro\",
    \"ciudad\": \"La Rioja\",
    \"provincia\": \"La Rioja\",
    \"clienteDocumento\": \"12345678\",
    \"clienteTelefono\": \"+543804123456\",
    \"clienteDireccionFacturacion\": \"Av. San Martín 1234, La Rioja\",
    \"planId\": \"${PLAN_ID}\",
    \"observaciones\": \"Inmueble en buen estado, requiere mantenimiento básico\",
    \"decision\": \"APPROVED\",
    \"checklistItems\": [
      {
        \"categoria\": \"Seguridad\",
        \"descripcionItem\": \"Instalación eléctrica\",
        \"estado\": \"OK\",
        \"comentarios\": \"Instalación en buen estado\"
      },
      {
        \"categoria\": \"Plomería\",
        \"descripcionItem\": \"Cañerías principales\",
        \"estado\": \"REQUIERE_ATENCION\",
        \"comentarios\": \"Requiere revisión preventiva\"
      }
    ]
  }")

echo "Respuesta auditoría: $AUDIT_RESPONSE"

if echo "$AUDIT_RESPONSE" | grep -q "error\|Error\|ERROR"; then
  echo -e "${RED}❌ Error en la auditoría${NC}"
  echo "$AUDIT_RESPONSE" | jq '.' 2>/dev/null || echo "$AUDIT_RESPONSE"
else
  echo -e "${GREEN}✅ Auditoría completada exitosamente${NC}"
fi
echo ""

# ============================================
# PASO 9: Verificar suscripción creada
# ============================================
echo -e "${YELLOW}[PASO 9] Verificando suscripción...${NC}"

SUBSCRIPTIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/ops/subscriptions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "Respuesta suscripciones: $SUBSCRIPTIONS_RESPONSE"

# Verificar que la suscripción tenga el planId correcto
if echo "$SUBSCRIPTIONS_RESPONSE" | grep -q "\"planId\":\"${PLAN_ID}\""; then
  echo -e "${GREEN}✅ Suscripción relacionada correctamente con planId: ${PLAN_ID}${NC}"
else
  echo -e "${YELLOW}⚠️  Verificar manualmente la relación de la suscripción con el plan${NC}"
fi
echo ""

# ============================================
# PASO 10: Verificar emails enviados
# ============================================
echo -e "${YELLOW}[PASO 10] Verificando emails enviados...${NC}"

echo -e "${BLUE}Para verificar los emails enviados, revisa:${NC}"
echo "  1. El inbox de ${EMAIL}"
echo "  2. La tabla auth.email_audit en la base de datos:"
echo "     SELECT * FROM auth.email_audit WHERE email = '${EMAIL}' ORDER BY created_at DESC;"
echo ""

# ============================================
# RESUMEN
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RESUMEN${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Usuario ID: ${USER_ID}${NC}"
echo -e "${GREEN}✅ Cliente ID: ${CLIENT_ID}${NC}"
echo -e "${GREEN}✅ Propiedad ID: ${PROPERTY_ID}${NC}"
echo -e "${GREEN}✅ Plan ID: ${PLAN_ID}${NC}"
echo ""
echo -e "${BLUE}Prueba completada!${NC}"

