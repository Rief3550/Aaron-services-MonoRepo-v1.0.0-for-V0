# Email Service - Resend Integration

Servicio de envío de emails con Resend, plantillas, logging en EmailAudit e idempotencia.

## Características

✅ **Integración con Resend**: Envío real de emails via Resend API  
✅ **Plantillas HTML/TEXT**: Templates profesionales para VerifyEmail y ResetPassword  
✅ **Logging en EmailAudit**: Registro de todos los envíos con status y metadata  
✅ **Idempotencia**: Previene envíos duplicados en ventana de 5 minutos  
✅ **Manejo de errores**: Logs detallados y actualización de status en EmailAudit  

## Uso

### Enviar Email de Verificación

```typescript
import { EmailService } from './services/email.service';

const emailService = new EmailService();
const token = generateUUID();

const result = await emailService.sendVerificationEmail(
  'user@example.com',
  userId,
  token
);

if (result._tag === 'error') {
  // Manejar error
} else {
  // Email enviado (o bloqueado por idempotencia)
  console.log('Sent:', result.value.sent);
  console.log('Audit ID:', result.value.auditId);
}
```

### Enviar Email de Reset Password

```typescript
const emailService = new EmailService();
const token = generateUUID();

const result = await emailService.sendResetPasswordEmail(
  'user@example.com',
  userId,
  token
);
```

## Idempotencia

El servicio previene envíos duplicados de emails del mismo tipo al mismo email en una ventana de **5 minutos**.

- Si se intenta enviar un email VERIFY al mismo email dentro de 5 minutos, se bloquea
- Si se intenta enviar un email RESET al mismo email dentro de 5 minutos, se bloquea
- Se puede forzar el envío con `ignoreIdempotency: true`

```typescript
// Forzar envío (ignorar idempotencia)
await emailService.sendVerificationEmail(
  email,
  userId,
  token,
  true // ignoreIdempotency
);
```

## EmailAudit

Cada envío de email se registra en `EmailAudit` con:

- `userId`: ID del usuario (opcional)
- `email`: Email destino
- `type`: Tipo de email (`VERIFY`, `RESET`, `NOTICE`)
- `status`: Estado (`SENT`, `DELIVERED`, `FAILED`)
- `meta`: Metadata adicional:
  - `token`: Token de verificación/reset
  - `url`: URL del enlace
  - `resendId`: ID del email en Resend (si fue exitoso)
  - `error`: Mensaje de error (si falló)
  - `sentAt`: Timestamp del envío

### Actualizar Estado

```typescript
import { EmailService } from './services/email.service';

// Marcar como entregado (cuando se verifica o usa el token)
await EmailService.updateEmailAuditStatus(
  auditId,
  'DELIVERED',
  { verifiedAt: new Date().toISOString() }
);

// Marcar como fallido
await EmailService.updateEmailAuditStatus(
  auditId,
  'FAILED',
  { error: 'Error message' }
);
```

## Plantillas

### Verify Email

Template HTML profesional para verificación de email con:
- Botón destacado para verificar
- Enlace de respaldo (texto)
- Información de expiración
- Diseño responsive

### Reset Password

Template HTML profesional para reset de contraseña con:
- Botón destacado para resetear
- Enlace de respaldo (texto)
- Advertencia de seguridad
- Información de expiración

## Configuración

### Variables de Entorno

```bash
RESEND_API_KEY=re_live_xxx
MAIL_FROM="Hornero <noreply@hornero.app>"
FRONTEND_URL=http://localhost:3000
```

### Resend Setup

1. Crear cuenta en [Resend](https://resend.com)
2. Obtener API Key
3. Configurar dominio (opcional, usar dominio por defecto para pruebas)
4. Agregar `RESEND_API_KEY` a `.env`

## Endpoints que Usan Email

### Signup

```typescript
// POST /auth/signup
// Automáticamente envía email de verificación después del registro
```

### Verify Email (Frontend)

```typescript
// El usuario hace clic en el enlace del email
// GET /verify-email?token=xxx
// El frontend debe llamar a un endpoint del backend para verificar el token
// (Este endpoint aún no está implementado)
```

### Forgot Password

```typescript
// POST /auth/forgot-password
// Envía email de reset con token
```

### Reset Password

```typescript
// POST /auth/reset-password
// Verifica token y actualiza contraseña
// Actualiza EmailAudit a status 'DELIVERED'
```

## Debugging

### Ver Logs de Email

```sql
SELECT * FROM auth.email_audit 
WHERE email = 'user@example.com' 
ORDER BY created_at DESC;
```

### Ver Metadata

```typescript
const audit = await prisma.emailAudit.findUnique({ where: { id } });
const meta = audit.meta as any;
console.log(meta.token);
console.log(meta.resendId);
console.log(meta.error);
```

## Troubleshooting

### Error: "RESEND_API_KEY not provided"
- Verificar que `RESEND_API_KEY` esté en `.env`
- Reiniciar el servicio después de agregar la variable

### Emails no se envían pero no hay error
- Verificar logs para ver si fue bloqueado por idempotencia
- Verificar que Resend esté configurado correctamente
- Revisar dashboard de Resend para ver intentos de envío

### Email bloqueado por idempotencia
- Esperar 5 minutos entre envíos
- O usar `ignoreIdempotency: true` para forzar envío

