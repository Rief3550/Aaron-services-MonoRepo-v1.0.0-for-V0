# 🚀 VPS Deployment Guide - Hostinger

## 📋 Pre-requisitos

- VPS IP: `147.79.83.143`
- SSH Port: `372`
- User: `devops`
- Docker & Docker Compose instalados en VPS

---

## 🎯 Deployment en 1 Hora - Paso a Paso

### 1️⃣ Conectar al VPS (5 min)

```bash
ssh -p 372 devops@147.79.83.143
```

### 2️⃣ Preparar Directorio (5 min)

```bash
# Crear directorio para la aplicación
cd /srv
sudo mkdir -p aaron
sudo chown devops:devops aaron
cd aaron

# Clonar repositorio
git clone https://github.com/Rief3550/Aaron-serv-Backend-Def.git .
```

### 3️⃣ Configurar Variables de Entorno (10 min)

```bash
# Copiar template de producción
cp .env.production .env.production.local

# Editar con valores reales
nano .env.production

# ⚠️ IMPORTANTE: Cambiar estos valores:
# - JWT_SECRET (generar string random de 32+ caracteres)
# - JWT_ACCESS_SECRET (generar string random de 32+ caracteres)
# - JWT_REFRESH_SECRET (generar string random de 32+ caracteres)
# - POSTGRES_PASSWORD (password seguro para DB)
# - RESEND_API_KEY (si tienes cuenta Resend)
# - GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET (si usas Google OAuth)
# - STRIPE_SECRET_KEY (si usas Stripe)
```

**Generar secrets seguros:**
```bash
# Generar JWT secrets
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

### 4️⃣ Deploy Aplicación (30 min)

```bash
# Opción A: Usar script automático
./deploy-vps.sh

# Opción B: Manual
docker compose -f docker-compose.prod.yml up -d --build
```

### 5️⃣ Verificar Deployment (10 min)

```bash
# Ver status de contenedores
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f app

# Verificar health
curl http://localhost/health
```

### 6️⃣ Probar desde tu Máquina (5 min)

```bash
# Desde tu laptop
curl http://147.79.83.143/health

# Login admin
curl -X POST http://147.79.83.143/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aaron.com","password":"admin123"}'
```

---

## 🔄 Arquitectura en VPS

```
Internet (Cliente)
    │
    ├─ http://147.79.83.143 (Puerto 80)
    │
    ▼
┌─────────────────────────────────────┐
│   Docker Container (app)            │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ Auth Service    :3001       │  │
│   │ Operations      :3002       │  │
│   │ Tracking        :3003       │  │
│   │ API Gateway     :3000       │  │
│   │ Frontend (static)           │  │
│   └─────────────────────────────┘  │
│                                     │
│   Comunicación interna:             │
│   - localhost:3001 (auth)           │
│   - localhost:3002 (operations)     │
│   - localhost:3003 (tracking)       │
└─────────────────────────────────────┘
         │              │
    ┌────▼──┐      ┌───▼────┐
    │ Redis │      │   DB   │
    │ :6379 │      │ :5432  │
    └───────┘      └────────┘
```

---

## 📝 Variables de Entorno - Explicación

### URLs Internas (Container to Container)
```bash
# Estos NO cambian entre dev y prod
# Porque todos los servicios están en el MISMO contenedor
AUTH_SERVICE_URL=http://localhost:3001
OPERATIONS_SERVICE_URL=http://localhost:3002
TRACKING_SERVICE_URL=http://localhost:3003
```

### URLs Externas (Browser to API)
```bash
# DESARROLLO (tu laptop)
NEXT_PUBLIC_API_URL=http://localhost:3100

# PRODUCCIÓN (VPS)
NEXT_PUBLIC_API_URL=http://147.79.83.143

# PRODUCCIÓN con Dominio (futuro)
NEXT_PUBLIC_API_URL=https://api.aaron-services.com
```

### Database
```bash
# DESARROLLO (Postgres local en tu Mac)
DATABASE_URL=postgresql://root:password@host.docker.internal:5432/postgres

# PRODUCCIÓN (Postgres en Docker)
DATABASE_URL=postgresql://aaron_user:password@db:5432/aaron
```

---

## 🛠️ Comandos Útiles

### Ver Logs
```bash
# Todos los logs
docker compose -f docker-compose.prod.yml logs -f

# Solo app
docker compose -f docker-compose.prod.yml logs -f app

# Solo database
docker compose -f docker-compose.prod.yml logs -f db
```

### Reiniciar Servicios
```bash
# Reiniciar todo
docker compose -f docker-compose.prod.yml restart

# Reiniciar solo app
docker compose -f docker-compose.prod.yml restart app
```

### Actualizar Código
```bash
# Pull latest
git pull origin main

# Rebuild y restart
docker compose -f docker-compose.prod.yml up -d --build
```

### Ejecutar Comandos en Container
```bash
# Entrar al container
docker compose -f docker-compose.prod.yml exec app sh

# Ejecutar comando directo
docker compose -f docker-compose.prod.yml exec app \
  sh -c "cd backend/services/auth-service && npx prisma migrate deploy"
```

### Backup Database
```bash
# Backup
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U aaron_user aaron > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20251125.sql | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U aaron_user aaron
```

---

## 🔒 Seguridad - Checklist

- [ ] Cambiar todos los JWT secrets
- [ ] Cambiar password de Postgres
- [ ] Configurar firewall (solo puerto 80 y 372)
- [ ] Actualizar CORS_ORIGINS con dominio real
- [ ] Usar HTTPS con certificado SSL (Nginx + Let's Encrypt)
- [ ] Cambiar credenciales de admin por defecto
- [ ] Configurar rate limiting
- [ ] Habilitar logs de auditoría

---

## 🚨 Troubleshooting

### Container no inicia
```bash
# Ver logs detallados
docker compose -f docker-compose.prod.yml logs app

# Verificar variables de entorno
docker compose -f docker-compose.prod.yml config
```

### Database connection error
```bash
# Verificar que DB esté corriendo
docker compose -f docker-compose.prod.yml ps db

# Ver logs de DB
docker compose -f docker-compose.prod.yml logs db

# Probar conexión manual
docker compose -f docker-compose.prod.yml exec db \
  psql -U aaron_user -d aaron
```

### Puerto 80 ya en uso
```bash
# Ver qué está usando el puerto
sudo lsof -i :80

# Cambiar puerto en docker-compose.prod.yml
# ports:
#   - "8080:3000"  # Usar 8080 en vez de 80
```

---

## 📞 URLs de Acceso

### Durante Testing (IP)
- **Frontend**: http://147.79.83.143
- **API**: http://147.79.83.143/api
- **Health Check**: http://147.79.83.143/health

### Con Dominio (Futuro)
- **Frontend**: https://aaron-services.com
- **API**: https://api.aaron-services.com
- **Admin**: https://admin.aaron-services.com

---

## ⏱️ Timeline de 1 Hora

| Tiempo | Tarea |
|--------|-------|
| 0-5 min | Conectar SSH y preparar directorio |
| 5-15 min | Configurar .env.production |
| 15-45 min | Deploy y build (docker compose up) |
| 45-55 min | Verificar y troubleshoot |
| 55-60 min | Probar endpoints y confirmar funcionamiento |

---

## ✅ Checklist Final

- [ ] SSH conectado al VPS
- [ ] Repositorio clonado en `/srv/aaron`
- [ ] `.env.production` configurado con valores reales
- [ ] `docker compose -f docker-compose.prod.yml up -d --build` ejecutado
- [ ] Containers corriendo (`docker compose ps`)
- [ ] Health check responde: `curl http://147.79.83.143/health`
- [ ] Login funciona: `curl http://147.79.83.143/auth/signin`
- [ ] Frontend carga en navegador: `http://147.79.83.143`

---

## 🎯 ¡Listo para Producción!

Una vez completados todos los pasos, tu aplicación estará corriendo en:

**http://147.79.83.143**

Comparte esta URL con tu equipo para testing.
