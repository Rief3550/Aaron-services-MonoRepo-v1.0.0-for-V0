# 🚀 Cómo Correr el Proyecto

## 📋 Prerequisitos

- Node.js 20+
- pnpm instalado
- PostgreSQL corriendo en localhost:5432
- Variables de entorno configuradas

## 🔧 Setup Inicial

### 1. Instalar Dependencias
```bash
pnpm install
```

### 2. Generar Clientes de Prisma
```bash
# Generar todos los clientes de Prisma
cd backend/services/auth-service && pnpm prisma generate && cd ../../..
cd backend/services/operations-service && pnpm prisma generate && cd ../../..
cd backend/services/tracking-service && pnpm prisma generate && cd ../../..
```

O usar desde la raíz:
```bash
pnpm --filter @aaron/auth-service prisma:generate
pnpm --filter @aaron/operations-service prisma:generate
pnpm --filter @aaron/tracking-service prisma:generate
```

### 3. Configurar Variables de Entorno
Crear `.env.development` en la raíz basado en `.env.template`

## 🌐 Correr Frontend

### Desarrollo
```bash
cd frontend/web
pnpm dev
```

El frontend estará disponible en: **http://localhost:3000**

### Producción
```bash
cd frontend/web
pnpm build
pnpm start
```

## 🔧 Correr Backend

### Todos los Servicios (Recomendado)
```bash
# Desde la raíz del proyecto
pnpm dev
```

Esto correrá todos los servicios en paralelo:
- API Gateway: http://localhost:3001
- Auth Service: http://localhost:3002
- Operations Service: http://localhost:3003
- Tracking Service: http://localhost:3004

### Servicios Individuales
```bash
# Auth Service
cd backend/services/auth-service
pnpm dev

# Operations Service
cd backend/services/operations-service
pnpm dev

# Tracking Service
cd backend/services/tracking-service
pnpm dev

# API Gateway
cd backend/services/api-gateway
pnpm dev
```

## 🐳 Con Docker

### Desarrollo
```bash
docker-compose up
```

## 📝 Scripts Útiles

### Generar Prisma Clients
```bash
pnpm --filter @aaron/auth-service prisma:generate
pnpm --filter @aaron/operations-service prisma:generate
pnpm --filter @aaron/tracking-service prisma:generate
```

### Aplicar Migraciones
```bash
cd backend/services/auth-service
pnpm prisma db push

cd ../operations-service
pnpm prisma db push

cd ../tracking-service
pnpm prisma db push
```

## ⚠️ Errores Comunes

### Error: Cannot find module '@aaron/prisma-client-*'
**Solución**: Generar los clientes de Prisma:
```bash
pnpm --filter @aaron/auth-service prisma:generate
pnpm --filter @aaron/operations-service prisma:generate
pnpm --filter @aaron/tracking-service prisma:generate
```

### Error: Prisma Client not found
**Solución**: Asegurarse de que los clientes están generados antes de correr el proyecto.

### Error: Database connection failed
**Solución**: Verificar que PostgreSQL está corriendo y que `DATABASE_URL` está correctamente configurada.

## 🔗 URLs del Proyecto

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Auth Service**: http://localhost:3002
- **Operations Service**: http://localhost:3003
- **Tracking Service**: http://localhost:3004

