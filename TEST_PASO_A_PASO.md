# 🧪 Prueba Paso a Paso - Flujo Completo

## Configuración

```bash
# URL base del API Gateway
# NOTA: Si usas Docker, el puerto es 3100. Si es desarrollo local, puede ser 3000
BASE_URL="http://localhost:3100"

# Datos del usuario
EMAIL="fede.riera7@gmail.com"
PASSWORD="Test123456!"
FULL_NAME="Federico Riera"
LAT=-29.408660
LNG=-66.858431
```

**Verificar que el servidor está corriendo:**
```bash
# Si usas Docker (puerto 3100)
curl http://localhost:3100/health

# Si es desarrollo local (puerto 3000)
curl http://localhost:3100/health
```

---

## 📝 PASO 1: Crear Usuario (Signup)

Este paso crea el usuario en el sistema y envía un email de verificación.

```bash
curl -X POST "http://localhost:3100/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "password": "Test123456!",
    "fullName": "Federico Riera",
    "lat": -29.408660,
    "lng": -66.858431
  }' | jq '.'
```

**Qué esperar:**
- ✅ Status 201 Created
- ✅ `user.id` - ID del usuario creado
- ✅ `tokens.accessToken` y `tokens.refreshToken`
- ✅ `user.isEmailVerified: false`
- ✅ Se envía email de verificación a `fede.riera7@gmail.com`

**Guardar estos valores:**
```bash
# Copiar el USER_ID de la respuesta
USER_ID="<copiar-id-aqui>"
ACCESS_TOKEN="<copiar-access-token-aqui>"
```

---

## 📧 PASO 2: Obtener Código de Verificación

El email contiene **SOLO un código de 6 dígitos** (sin enlace URL).

### Opción A: Revisar el email recibido

El email muestra un código de 6 dígitos destacado, por ejemplo: `123456`

### Opción B: Consultar la base de datos

```bash
PGPASSWORD=devAS.team psql -h localhost -p 5432 -U root -d postgres -c "SELECT meta->>'verificationCode' as code, status, \"createdAt\" FROM auth.email_audit WHERE email = 'fede.riera7@gmail.com' AND type = 'VERIFY' ORDER BY \"createdAt\" DESC LIMIT 1;"
```

**Guardar el código:**
```bash
VERIFICATION_CODE="<copiar-codigo-6-digitos-aqui>"
```

---

## ✅ PASO 3: Verificar Email

Este paso verifica el email y **automáticamente crea el Cliente** en operations-service.

**Tienes dos opciones para verificar:**

### Verificar con Código de 6 Dígitos (App Móvil) ⭐

El email incluye **SOLO** un código de 6 dígitos (sin enlace URL). Úsalo así:

```bash
# Obtener el código del email (está en el email recibido)
VERIFICATION_CODE="123456"  # Reemplazar con el código del email

curl -X POST "http://localhost:3100/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"${VERIFICATION_CODE}\",
    \"email\": \"fede.riera7@gmail.com\"
  }" | jq '.'
```

**Obtener el código desde la base de datos:**
```bash
PGPASSWORD=devAS.team psql -h localhost -p 5432 -U root -d postgres -c "SELECT meta->>'verificationCode' as code FROM auth.email_audit WHERE email = 'fede.riera7@gmail.com' AND type = 'VERIFY' ORDER BY \"createdAt\" DESC LIMIT 1;"
```

**Qué esperar:**
- ✅ Status 200 OK
- ✅ Respuesta con estado de verificación:
  ```json
  {
    "success": true,
    "message": "Email verified successfully",
    "data": {
      "verified": true,
      "userId": "...",
      "email": "fede.riera7@gmail.com",
      "isEmailVerified": true
    }
  }
  ```
- ✅ Se crea automáticamente un `Client` en operations-service con estado `PENDIENTE`

**Verificar que el cliente se creó:**
```bash
# Necesitamos un token de admin/auditor para esto
# Ver PASO 4 primero
```

---

## 🔐 PASO 4: Login (Obtener Token de Acceso)

Hacemos login para obtener un token que nos permita hacer operaciones.

```bash
curl -X POST "http://localhost:3100/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "password": "Test123456!"
  }' | jq '.'
```

**Qué esperar:**
- ✅ Status 200 OK
- ✅ `tokens.accessToken` - Token para usar en requests autenticados
- ✅ `tokens.refreshToken` - Token para refrescar el acceso

**Guardar el token:**
```bash
ACCESS_TOKEN="<copiar-access-token-aqui>"
```

**O si necesitas usar un admin:**
```bash
# Login como admin (si existe)
curl -X POST "http://localhost:3100/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aaron.com",
    "password": "admin123"
  }' | jq '.'
```

---

## 👤 PASO 5: Verificar Cliente Creado

Verificamos que el cliente se creó correctamente después de verificar el email.

```bash
# Listar clientes pendientes
curl -X GET "http://localhost:3100/ops/clients/pending" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

**Qué esperar:**
- ✅ Lista de clientes con estado `PENDIENTE`
- ✅ Debe incluir el cliente con email `fede.riera7@gmail.com`
- ✅ `estado: "PENDIENTE"`

**Guardar el CLIENT_ID:**
```bash
CLIENT_ID="<copiar-client-id-aqui>"
```

**O ver todos los clientes:**
```bash
curl -X GET "http://localhost:3100/ops/clients" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

---

## 📋 PASO 6: Listar Planes Disponibles

Necesitamos un plan para crear la suscripción. Primero vemos qué planes hay.

```bash
curl -X GET "http://localhost:3100/ops/plans" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

**Qué esperar:**
- ✅ Lista de planes activos
- ✅ Cada plan tiene: `id`, `name`, `price`, `currency`

**Si no hay planes, crear uno:**
```bash
curl -X POST "http://localhost:3100/ops/admin/plans" \
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
  }' | jq '.'
```

**Guardar el PLAN_ID:**
```bash
PLAN_ID="<copiar-plan-id-aqui>"
```

---

## 🏠 PASO 7: Crear Propiedad (Inmueble)

Creamos la propiedad con las coordenadas especificadas.

```bash
curl -X POST "http://localhost:3100/ops/properties" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"address\": \"Av. San Martín 1234, La Rioja, La Rioja\",
    \"lat\": ${LAT},
    \"lng\": ${LNG},
    \"summary\": \"Departamento en zona céntrica de La Rioja\"
  }" | jq '.'
```

**Qué esperar:**
- ✅ Status 201 Created
- ✅ `id` - ID de la propiedad creada
- ✅ `status: "PRE_ONBOARD"`
- ✅ `lat` y `lng` con las coordenadas especificadas

**Guardar el PROPERTY_ID:**
```bash
PROPERTY_ID="<copiar-property-id-aqui>"
```

---

## 🔍 PASO 8: Completar Auditoría del Inmueble

Este es el paso más importante. Completa la auditoría, actualiza los datos del inmueble, y si se aprueba, crea la suscripción.

```bash
curl -X POST "http://localhost:3100/ops/properties/${PROPERTY_ID}/audit" \
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
  }" | jq '.'
```

**Qué esperar:**
- ✅ Status 200 OK
- ✅ `property.status: "ACTIVE"` (si se aprobó)
- ✅ `decision: "APPROVED"`
- ✅ Mensaje de éxito
- ✅ **Se crea automáticamente la suscripción** si se aprobó y se especificó `planId`
- ✅ **El cliente cambia a estado `ACTIVO`**

---

## 📦 PASO 9: Verificar Suscripción Creada

Verificamos que la suscripción se creó correctamente y está relacionada con el plan.

```bash
# Listar todas las suscripciones
curl -X GET "http://localhost:3100/ops/subscriptions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

**Qué esperar:**
- ✅ Lista de suscripciones
- ✅ Debe incluir la suscripción del usuario
- ✅ `planId` debe coincidir con el `PLAN_ID` usado
- ✅ `status: "ACTIVE"`
- ✅ `propertyId` debe coincidir con el `PROPERTY_ID`
- ✅ `clientId` debe coincidir con el `CLIENT_ID`
- ✅ **IMPORTANTE**: La respuesta debe incluir el objeto `plan` completo:
  ```json
  {
    "id": "...",
    "planId": "<PLAN_ID>",
    "plan": {
      "id": "<PLAN_ID>",
      "name": "Plan Departamento Básico",
      "price": 15000,
      "currency": "ARS"
    },
    "property": { ... },
    ...
  }
  ```

**Verificar relación con plan específicamente:**
```bash
# Filtrar la suscripción del usuario y verificar el plan
curl -X GET "http://localhost:3100/ops/subscriptions?userId=${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.[] | {planId, plan: .plan.id, planName: .plan.name}'
```

**Verificar que el planId está relacionado correctamente:**
```bash
# La respuesta debe incluir:
# ✅ "planId": "<PLAN_ID>" - Campo directo con el ID del plan
# ✅ "plan": { ... } - Objeto completo del plan relacionado
# ✅ Verificar que plan.id === planId
```

**Comando para verificar la relación:**
```bash
# Verificar que planId y plan.id coinciden
curl -X GET "http://localhost:3100/ops/subscriptions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | \
  jq '.[] | select(.userId == "'${USER_ID}'") | {planId, planIdFromPlan: .plan.id, match: (.planId == .plan.id)}'
```

**Resultado esperado:**
```json
{
  "planId": "<PLAN_ID>",
  "planIdFromPlan": "<PLAN_ID>",
  "match": true
}
```

---

## 📧 PASO 10: Verificar Emails Enviados

Verificamos que los emails se enviaron correctamente.

### Opción A: Consultar la base de datos

```sql
SELECT 
  id,
  email,
  type,
  status,
  meta->>'resendId' as resend_id,
  created_at
FROM auth.email_audit 
WHERE email = 'fede.riera7@gmail.com' 
ORDER BY created_at DESC;
```

**Qué esperar:**
- ✅ Al menos un registro con `type: 'VERIFY'`
- ✅ `status: 'SENT'` o `'DELIVERED'`
- ✅ `resend_id` si se usó Resend

### Opción B: Revisar el inbox

Revisar el email `fede.riera7@gmail.com` para verificar que recibió:
- ✅ Email de verificación con el enlace

---

## 🔍 PASO 11: Verificar Estado Final

Verificamos el estado final de todos los componentes.

### Cliente
```bash
curl -X GET "http://localhost:3100/ops/clients/${CLIENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

**Esperado:**
- ✅ `estado: "ACTIVO"` (después de la auditoría aprobada)

### Propiedad
```bash
curl -X GET "http://localhost:3100/ops/properties/${PROPERTY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

**Esperado:**
- ✅ `status: "ACTIVE"`
- ✅ `lat` y `lng` con las coordenadas correctas
- ✅ Todos los datos completados (ambientes, baños, superficie, etc.)

### Suscripción
```bash
curl -X GET "http://localhost:3100/ops/subscriptions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.[] | select(.userId == "'${USER_ID}'")'
```

**Esperado:**
- ✅ `status: "ACTIVE"`
- ✅ `planId` relacionado correctamente
- ✅ `propertyId` relacionado correctamente
- ✅ `clientId` relacionado correctamente

---

## ✅ Checklist Final

- [ ] Usuario creado con email `fede.riera7@gmail.com`
- [ ] Email de verificación enviado
- [ ] Email verificado
- [ ] Cliente creado automáticamente con estado `PENDIENTE`
- [ ] Propiedad creada con coordenadas `-29.408660, -66.858431`
- [ ] Auditoría completada y aprobada
- [ ] Cliente actualizado a estado `ACTIVO`
- [ ] Propiedad actualizada a estado `ACTIVE`
- [ ] Suscripción creada con `planId` relacionado
- [ ] Suscripción tiene `status: "ACTIVE"`
- [ ] Todos los datos del inmueble completados

---

## 🐛 Troubleshooting

### Error: "User already exists"
```bash
# El usuario ya existe, puedes continuar desde el PASO 4 (login)
```

### Error: "Invalid or expired token"
- Verifica que el token de verificación sea el correcto
- Los tokens expiran en 24 horas

### Error: "Unauthorized" o "Forbidden"
- Verifica que el `ACCESS_TOKEN` sea válido
- Verifica que el usuario tenga los roles necesarios (ADMIN, AUDITOR)

### No se creó el cliente después de verificar email
- Verifica que el usuario tenga el rol `CUSTOMER`
- Revisa los logs del operations-service

### La suscripción no se creó después de la auditoría
- Verifica que `decision: "APPROVED"`
- Verifica que se especificó `planId` en la auditoría
- Verifica que el plan existe y está activo

