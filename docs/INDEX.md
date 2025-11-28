# 📚 Documentación del Proyecto

Índice completo de la documentación del monorepo Aaron Backend Services.

## 🚀 Inicio Rápido

- [Guía de Inicio Rápido](./guides/QUICK_START.md) - Comienza aquí para configurar el proyecto rápidamente
- [Instalación Completa](./setup/SETUP_COMPLETE.md) - Guía detallada paso a paso
- [Configuración de Variables de Entorno](./setup/ENV_SETUP.md) - Configuración de .env para todos los servicios

## 📖 Guías

### Setup e Instalación
- [Setup Completo](./setup/SETUP_COMPLETE.md)
- [Guía de Instalación](./setup/INSTALL.md)
- [Setup de Prisma](./setup/SETUP_PRISMA.md)
- [Configuración de Entorno](./setup/ENV_SETUP.md)

### Desarrollo y Operaciones
- [Comandos Útiles](./guides/COMANDOS_UTILES.md)
- [Quality Pipelines](./guides/QUALITY_PIPELINES.md)
- [Módulos del Proyecto](./guides/MODULES.md)

### Docker e Infraestructura
- [Docker Setup](./guides/DOCKER_SETUP.md)
- [Verificación de Prisma](./guides/PRISMA_VERIFICATION.md)

## 🏗️ Servicios

### API Gateway
- [README](./services/api-gateway/README.md) - Documentación principal
- [Gateway Routing](./services/api-gateway/GATEWAY_ROUTING.md) - Configuración de enrutamiento

### Auth Service
- [README](./services/auth-service/README.md) - Documentación principal
- [Email Service](./services/auth-service/EMAIL_SERVICE.md) - Servicio de correo electrónico
- [Google OAuth](./services/auth-service/GOOGLE_OAUTH.md) - Integración con Google OAuth

### Operations Service
- [README](./services/operations-service/README.md) - Documentación principal
- [Estados y Transiciones](./services/operations-service/STATES.md) - Máquina de estados

### Tracking Service
- [README](./services/tracking-service/README.md) - Documentación principal
- [Integración](./services/tracking-service/INTEGRATION.md) - Integración con otros servicios

## 📚 Librerías

- [@aaron/auth](./libs/auth/README.md) - Autenticación y autorización
- [@aaron/mail](./libs/mail/README.md) - Servicio de correo
- [@aaron/prisma](./libs/prisma/README.md) - Factory y middleware de Prisma

## 🐳 Infraestructura

- [Nginx](./infra/nginx/README.md) - Configuración de Nginx

## 📝 Notas

- El README.md principal se encuentra en la raíz del proyecto
- Cada servicio tiene su documentación específica en `docs/services/[servicio]/`
- Las librerías documentadas están en `docs/libs/`
