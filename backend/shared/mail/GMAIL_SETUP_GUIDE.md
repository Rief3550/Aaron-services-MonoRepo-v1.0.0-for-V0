# 🔐 Guía Completa: Configurar Gmail API con Google Cloud

## 📋 Opción 1: App Password (MÁS SIMPLE - Recomendado para desarrollo)

### ✅ Ventajas:
- ✅ Configuración en 2 minutos
- ✅ No requiere Google Cloud Console
- ✅ Funciona inmediatamente
- ✅ Perfecto para desarrollo y pruebas

### 📝 Pasos:

1. **Habilitar verificación en 2 pasos**:
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos" (si no la tienes)
   - Sigue las instrucciones para configurarla

2. **Generar App Password**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Si no ves esta opción, asegúrate de tener verificación en 2 pasos activada
   - Selecciona:
     - **App**: "Correo"
     - **Dispositivo**: "Otro (nombre personalizado)"
     - **Nombre**: "AARON SERVICIOS"
   - Clic en "Generar"
   - **Copia la contraseña de 16 caracteres** (aparece como: `xxxx xxxx xxxx xxxx`)

3. **Configurar en el proyecto**:
   ```bash
   # En tu archivo .env o docker-compose.yml
   GMAIL_USER=servicesaaron0@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # Sin espacios, todo junto
   MAIL_FROM=servicesaaron0@gmail.com
   MAIL_PROVIDER=gmail
   ```

**¡Listo!** Ya puedes enviar emails. No necesitas nada más.

---

## 📋 Opción 2: OAuth2 (Para producción - Más seguro)

### ✅ Ventajas:
- ✅ Más seguro para producción
- ✅ Mejor control de permisos
- ✅ Ideal para aplicaciones en producción

### 📝 Pasos:

#### Paso 1: Crear Proyecto en Google Cloud Console

1. **Ir a Google Cloud Console**:
   - Ve a: https://console.cloud.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear o seleccionar proyecto**:
   - Clic en el selector de proyectos (arriba)
   - Clic en "NUEVO PROYECTO"
   - Nombre: "AARON SERVICIOS" (o el que prefieras)
   - Clic en "CREAR"

#### Paso 2: Habilitar Gmail API

1. **Ir a APIs & Services**:
   - En el menú lateral, ve a "APIs & Services" > "Library"
   - O ve directamente a: https://console.cloud.google.com/apis/library

2. **Buscar y habilitar Gmail API**:
   - Busca "Gmail API"
   - Clic en "Gmail API"
   - Clic en "HABILITAR"

#### Paso 3: Crear Credenciales OAuth2

1. **Ir a Credentials**:
   - Ve a "APIs & Services" > "Credentials"
   - O directamente: https://console.cloud.google.com/apis/credentials

2. **Crear OAuth Client ID**:
   - Clic en "CREAR CREDENCIALES" > "ID de cliente de OAuth"
   - Si es la primera vez, te pedirá configurar la pantalla de consentimiento:
     - **Tipo de usuario**: "Externo" (a menos que tengas Google Workspace)
     - **Nombre de la app**: "AARON SERVICIOS"
     - **Email de soporte**: tu email
     - **Dominios autorizados**: déjalo vacío por ahora
     - **Email del desarrollador**: tu email
     - Clic en "GUARDAR Y CONTINUAR"
     - En "Scopes", clic en "GUARDAR Y CONTINUAR"
     - En "Usuarios de prueba", agrega tu email y clic en "GUARDAR Y CONTINUAR"
     - Revisa y clic en "VOLVER AL PANEL"

3. **Crear el OAuth Client ID**:
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "AARON SERVICIOS Web Client"
   - **URI de redirección autorizados**: 
     - Agrega: `https://developers.google.com/oauthplayground`
   - Clic en "CREAR"
   - **¡IMPORTANTE!** Copia:
     - **Client ID**: `xxxxx.apps.googleusercontent.com`
     - **Client Secret**: `xxxxx`

#### Paso 4: Obtener Refresh Token

1. **Ir a OAuth Playground**:
   - Ve a: https://developers.google.com/oauthplayground

2. **Configurar OAuth Playground**:
   - Clic en el ícono de configuración (⚙️) arriba a la derecha
   - Marca "Use your own OAuth credentials"
   - Pega tu **Client ID** y **Client Secret**
   - Clic en "Close"

3. **Autorizar APIs**:
   - En el panel izquierdo, busca "Gmail API v1"
   - Expande y selecciona: `https://mail.google.com/`
   - Clic en "Authorize APIs"
   - Inicia sesión y autoriza los permisos
   - Acepta los permisos solicitados

4. **Obtener Refresh Token**:
   - En "Step 2", clic en "Exchange authorization code for tokens"
   - **Copia el "Refresh token"** (es un string largo)

#### Paso 5: Configurar en el proyecto

```bash
# En tu archivo .env o docker-compose.yml
GMAIL_USER=servicesaaron0@gmail.com
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
MAIL_FROM=servicesaaron0@gmail.com
MAIL_PROVIDER=gmail
```
Refresh token: 
1//04b3tTDs06jtSCgYIARAAGAQSNwF-L9IrHDSRUegUSNyrh3a4GOBeStjcCBQ5O3MGQPY07iHzqnQTtzGCOvPu_VJ1VE7WH36INno
Access token: 
ya29.a0ATi6K2ueTL25b4z_pQdw2jU4wjCUN_IyHuX9EgL0Dp2SMpWPylCVjWoCVPJoJ6hLXaKflEgvuKB6tnWbtaQVRhUWSLs5n-JCcFx4d9OtoC-ppVRTN1GYnoGT3StcJnSzsu3h42PpDuUpl5vrlPRrcC9uTpPr0L4Fwz_WXAkN8vZxH8BJTvjnzy8pyRiLWaurzFaarRAaCgYKARASARESFQHGX2MikUm2Wt1J9KFmo-Iz-G4zog0206

---

## 🚀 Probar la configuración

### Con App Password (Opción 1):
```bash
# Agregar al .env o docker-compose.yml
GMAIL_USER=servicesaaron0@gmail.com
GMAIL_APP_PASSWORD=tu-app-password-sin-espacios
MAIL_PROVIDER=gmail
MAIL_FROM=servicesaaron0@gmail.com

# Reiniciar contenedor
docker-compose restart app

# Probar envío
curl -X POST "http://localhost:3100/ops/test-email/activation" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"fede.riera7@gmail.com","nombreCompleto":"Federico Riera","planNombre":"Plan Test"}'
```

### Con OAuth2 (Opción 2):
```bash
# Agregar al .env o docker-compose.yml
GMAIL_USER=servicesaaron0@gmail.com
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
MAIL_PROVIDER=gmail
MAIL_FROM=servicesaaron0@gmail.com

# Reiniciar contenedor
docker-compose restart app
```

---

## 📊 Comparación

| Característica | App Password | OAuth2 |
|---------------|--------------|--------|
| Facilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Seguridad | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Tiempo setup | 2 minutos | 10-15 minutos |
| Para desarrollo | ✅ Ideal | ✅ Funciona |
| Para producción | ⚠️ Funciona | ✅ Recomendado |
| Requiere Google Cloud | ❌ No | ✅ Sí |

---

## 🔍 Troubleshooting

### Error: "Invalid login"
- Verifica que el App Password esté correcto (sin espacios)
- Asegúrate de tener verificación en 2 pasos activada

### Error: "Invalid credentials" (OAuth2)
- Verifica que el Client ID y Secret sean correctos
- Asegúrate de que el Refresh Token no haya expirado
- Verifica que Gmail API esté habilitada en Google Cloud

### Error: "Access denied"
- Verifica que hayas autorizado los permisos en OAuth Playground
- Asegúrate de que tu email esté en "Usuarios de prueba" en Google Cloud

---

## 💡 Recomendación

**Para empezar rápido**: Usa **App Password** (Opción 1)
- Es más simple
- Funciona inmediatamente
- Perfecto para desarrollo

**Para producción**: Usa **OAuth2** (Opción 2)
- Más seguro
- Mejor control de permisos
- Escalable

