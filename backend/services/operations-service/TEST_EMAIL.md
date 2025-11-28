# 🧪 Prueba de Envío de Emails

## Configuración

Las credenciales de Resend ya están configuradas en `docker-compose.yml`:
- `RESEND_API_KEY=re_c32RXBst_GvVmBoNhEjWtZLWm99BhZrgp`
- `MAIL_FROM=servicesaaron0@gmail.com`

## Endpoint de Prueba

### Enviar Email de Activación (Prueba)

```bash
curl -X POST "http://localhost:3100/ops/test-email/activation" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "nombreCompleto": "Federico Riera",
    "planNombre": "Plan Departamento"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Email de activación enviado correctamente"
}
```

## Flujo Completo de Signup con Verificación

### 1. Registro de Usuario

```bash
curl -X POST "http://localhost:3100/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "password": "Test123456",
    "fullName": "Federico Riera"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "fede.riera7@gmail.com",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

**Nota:** El cliente NO se crea aún en operations-service. Se creará cuando el email sea verificado.

### 2. Verificar Email

El usuario recibe un email con un enlace de verificación. Para verificar manualmente:

```bash
# Obtener el token del email (o de la base de datos)
TOKEN="token-del-email"

curl -X POST "http://localhost:3100/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\"
  }"
```

**Después de verificar:**
- `isEmailVerified` = `true`
- Se crea automáticamente el `Client` en operations-service con estado `PENDIENTE`
- El cliente aparecerá en `/ops/clients/pending`

### 3. Verificar que el Cliente se Creó

```bash
curl -X GET "http://localhost:3100/ops/clients/pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Obtener Token de Verificación desde la Base de Datos

Si necesitas obtener el token de verificación para probar:

```sql
-- En PostgreSQL
SELECT 
  ea.id,
  ea.email,
  ea."userId",
  ea.meta->>'token' as token,
  ea.meta->>'verificationUrl' as verification_url,
  ea."createdAt"
FROM auth."email_audits" ea
WHERE ea.type = 'VERIFY' 
  AND ea.status IN ('SENT', 'DELIVERED')
ORDER BY ea."createdAt" DESC
LIMIT 1;
```

## Prueba Rápida

```bash
# 1. Obtener token de admin
ADMIN_TOKEN="tu-token-admin"

# 2. Probar envío de email de activación
curl -X POST "http://localhost:3100/ops/test-email/activation" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fede.riera7@gmail.com",
    "nombreCompleto": "Federico Riera",
    "planNombre": "Plan Departamento"
  }'

# 3. Verificar en el correo de fede.riera7@gmail.com
```


