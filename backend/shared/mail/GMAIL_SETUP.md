# 📧 Configuración de Gmail API

## Opción 1: App Password (Recomendado para desarrollo)

### Pasos:

1. **Habilitar verificación en 2 pasos** en tu cuenta de Google:
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Generar App Password**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Ingresa "AARON SERVICIOS" como nombre
   - Copia la contraseña generada (16 caracteres sin espacios)

3. **Configurar variables de entorno**:
   ```bash
   GMAIL_USER=servicesaaron0@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # Sin espacios
   MAIL_FROM=servicesaaron0@gmail.com
   MAIL_PROVIDER=gmail
   ```

## Opción 2: OAuth2 (Recomendado para producción)

### Pasos:

1. **Crear proyecto en Google Cloud Console**:
   - Ve a: https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar Gmail API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Gmail API" y habilítala

3. **Crear credenciales OAuth2**:
   - Ve a "APIs & Services" > "Credentials"
   - Clic en "Create Credentials" > "OAuth client ID"
   - Tipo: "Web application"
   - Agrega "https://developers.google.com/oauthplayground" como Redirect URI

4. **Obtener Refresh Token**:
   - Ve a: https://developers.google.com/oauthplayground
   - En "Step 1", selecciona "Gmail API v1" > "https://mail.google.com/"
   - Clic en "Authorize APIs"
   - Inicia sesión y autoriza
   - En "Step 2", clic en "Exchange authorization code for tokens"
   - Copia el "Refresh token"

5. **Configurar variables de entorno**:
   ```bash
   GMAIL_USER=servicesaaron0@gmail.com
   GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=tu-client-secret
   GMAIL_REFRESH_TOKEN=tu-refresh-token
   MAIL_FROM=servicesaaron0@gmail.com
   MAIL_PROVIDER=gmail
   ```

## Ventajas de Gmail API:

✅ **Cuota generosa**: 2000 emails/día gratis (más con Google Workspace)
✅ **No requiere verificar dominios externos**
✅ **Funciona con tu cuenta de Gmail existente**
✅ **Más flexible y confiable**
✅ **Sin costos adicionales**

## Límites:

- **Cuenta gratuita**: 2000 emails/día
- **Google Workspace**: Hasta 2000 emails/día por usuario (configurable)

## Prueba rápida:

```bash
# Con App Password
export GMAIL_USER=servicesaaron0@gmail.com
export GMAIL_APP_PASSWORD=tu-app-password
export MAIL_PROVIDER=gmail

# Reiniciar contenedor
docker-compose restart app
```


