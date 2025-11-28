# Google OAuth Implementation

Implementación completa del flujo de autenticación con Google OAuth.

## Flujo

1. **Usuario hace clic en "Iniciar sesión con Google"**
   - Frontend redirige a: `GET /auth/google`
   - El gateway enruta a: `GET http://auth-service:3001/auth/google`

2. **Auth Service redirige a Google**
   - Passport maneja automáticamente la redirección a Google
   - Usa `GOOGLE_CLIENT_ID` y `GOOGLE_CALLBACK_URL`

3. **Usuario autentica en Google**
   - Google muestra consentimiento
   - Usuario acepta permisos (profile, email)

4. **Google redirige al callback**
   - URL: `GET /auth/google/callback?code=...`
   - Google envía código de autorización

5. **Auth Service intercambia código por perfil**
   - Passport intercambia código por access token
   - Obtiene perfil de Google (email, nombre, etc.)

6. **Buscar o crear usuario**
   - Busca por `googleId` primero
   - Si no existe, busca por `email`
   - Si existe usuario con ese email, vincula `googleId` y marca `isEmailVerified = true`
   - Si no existe, crea nuevo usuario con `googleId` y `isEmailVerified = true`
   - Asigna rol `CUSTOMER` por defecto si no tiene roles

7. **Generar tokens JWT**
   - Genera `accessToken` (15 min)
   - Genera `refreshToken` (7 días)
   - Crea sesión en DB con refresh token

8. **Redirigir al frontend**
   - URL: `FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...&success=true`
   - Frontend debe:
     - Extraer tokens de query params
     - Almacenarlos (localStorage, cookies, etc.)
     - Redirigir a dashboard

## Endpoints

### `GET /auth/google`

Inicia el flujo de OAuth. No requiere parámetros.

**Respuesta:**
- Redirección HTTP 302 a Google

### `GET /auth/google/callback`

Callback de Google después de la autenticación.

**Query Params (de Google):**
- `code`: Código de autorización
- `error`: Error si el usuario canceló

**Respuesta (Exitosa):**
- Redirección HTTP 302 al frontend:
  ```
  FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...&success=true&userId=...
  ```

**Respuesta (Error):**
- Redirección HTTP 302 al frontend:
  ```
  FRONTEND_URL/auth/error?message=...
  ```

## Configuración

### Variables de Entorno

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### Google Cloud Console

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Crear credenciales OAuth 2.0
4. Configurar:
   - **Authorized redirect URIs**: `http://localhost:3001/auth/google/callback`
   - **Authorized JavaScript origins**: `http://localhost:3001`

## Comportamiento de Usuarios

### Usuario Nuevo
1. Se crea usuario en DB con:
   - `email`: del perfil de Google
   - `googleId`: ID de Google
   - `isEmailVerified`: `true` (Google verifica emails)
   - `fullName`: displayName de Google
   - `roles`: `['CUSTOMER']` (por defecto)

### Usuario Existente (por email)
1. Se busca usuario por email
2. Se vincula cuenta Google:
   - `googleId`: se actualiza
   - `isEmailVerified`: se marca como `true`
   - `fullName`: se actualiza si no tenía

### Usuario Existente (por googleId)
1. Se encuentra directamente por `googleId`
2. Se genera tokens y redirige (sin cambios)

## Seguridad

- ✅ **Verificación de email automática**: `isEmailVerified = true` siempre
- ✅ **Tokens seguros**: Mismo sistema que login normal
- ✅ **Rate limiting**: En endpoints de auth (5 req/15min)
- ✅ **Sesiones**: Refresh tokens almacenados en DB con revocación

## Frontend Integration

### Iniciar OAuth

```typescript
// Redirigir usuario a:
window.location.href = 'http://api-gateway:3000/auth/google';
```

### Manejar Callback

```typescript
// En /auth/callback
const params = new URLSearchParams(window.location.search);
const accessToken = params.get('accessToken');
const refreshToken = params.get('refreshToken');
const success = params.get('success');

if (success === 'true' && accessToken && refreshToken) {
  // Almacenar tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Redirigir a dashboard
  window.location.href = '/dashboard';
} else {
  // Mostrar error
  const error = params.get('message');
  console.error('OAuth error:', error);
}
```

## Troubleshooting

### Error: "OAuth error: access_denied"
- Usuario canceló el flujo en Google
- Redirigir a login con mensaje

### Error: "Invalid Google profile: missing email"
- Usuario no concedió permisos de email
- Verificar scopes en configuración

### Error: "No email provided by Google"
- Perfil de Google no incluye email
- Verificar configuración de OAuth en Google Cloud

## Testing

```bash
# Desarrollo local
curl -v http://localhost:3001/auth/google

# Debe redirigir a Google
# Después de autenticar, debería redirigir a:
# http://localhost:3000/auth/callback?accessToken=...&refreshToken=...
```

## Notas

- El gateway debe tener `/auth/google` y `/auth/google/callback` en `JWT_PUBLIC_ROUTES`
- Los tokens se pasan por query params (considerar usar fragment `#` en producción para mejor seguridad)
- En producción, considerar usar cookies httpOnly para tokens en lugar de query params

