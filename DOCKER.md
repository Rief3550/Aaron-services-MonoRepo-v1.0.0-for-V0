# Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- PostgreSQL running locally on port 5432
- Database user: `root` / Password: `Ollieconverse123`
- Schemas created: `auth`, `operations`, `tracking`

### Start Application
```bash
docker compose up -d --build
```

### Access Points
- **API Gateway + Frontend**: http://localhost:3100
- **Redis**: localhost:6379

---

## 📋 Architecture

This is a **unified Docker deployment** where all backend services run in a single container:

```
┌─────────────────────────────────────────────┐
│         Docker Container (app)              │
│  ┌──────────────────────────────────────┐  │
│  │ Auth Service        (port 3001)      │  │
│  │ Operations Service  (port 3002)      │  │
│  │ Tracking Service    (port 3003)      │  │
│  │ API Gateway         (port 3000)      │  │
│  │ Frontend (static, served by Gateway) │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │                    │
    ┌────▼──────┐        ┌───▼────────┐
    │   Redis   │        │  Postgres  │
    │  :6379    │        │  :5432     │
    └───────────┘        └────────────┘
```

### Why Single Container?
✅ **Faster Startup** - All services start together
✅ **Simpler Networking** - Services communicate via localhost
✅ **Easier Deployment** - One container to manage
✅ **Resource Efficient** - Shared Node.js runtime

---

## 🔧 Configuration Files

### Development (Local Postgres)
- **File**: `docker-compose.yml`
- **Database**: Local PostgreSQL on host machine
- **Command**: `docker compose up -d --build`

### Production (VPS)
- **File**: `docker-compose.prod.yml`
- **Database**: Can use local or containerized Postgres
- **Command**: `docker compose -f docker-compose.prod.yml up -d --build`

### Build Configuration
- **File**: `Dockerfile`
- **Type**: Multi-stage build
- **Stages**: deps → builder → runner

### Startup Script
- **File**: `start-all.sh`
- **Purpose**: Starts all services inside container
- **Services**: Auth, Operations, Tracking, API Gateway

---

## 🗄️ Database Setup

### Create Schemas
```sql
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS tracking;
```

### Run Migrations
```bash
# Auth Service
cd backend/services/auth-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres" \
  npx prisma migrate dev

# Operations Service
cd backend/services/operations-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres" \
  npx prisma db push

# Tracking Service
cd backend/services/tracking-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres" \
  npx prisma migrate dev
```

### Seed Data
```bash
cd backend/services/auth-service
DATABASE_URL="postgresql://root:Ollieconverse123@localhost:5432/postgres" \
  pnpm prisma:seed
```

This creates:
- **Admin User**: `admin@aaron.com` / `admin123`
- **Operator User**: `operator@test.com` / `Operator123!`
- **Roles**: ADMIN, OPERATOR, CREW, CUSTOMER, AUDITOR, FINANCE, SUPER_ADMIN

---

## 🌍 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://root:Ollieconverse123@host.docker.internal:5432/postgres

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Service Ports (Internal)
AUTH_SERVICE_PORT=3001
OPERATIONS_SERVICE_PORT=3002
TRACKING_SERVICE_PORT=3003
API_GATEWAY_PORT=3000

# Service URLs (Internal)
AUTH_SERVICE_URL=http://localhost:3001
OPERATIONS_SERVICE_URL=http://localhost:3002
TRACKING_SERVICE_URL=http://localhost:3003
```

### Optional Variables
```bash
# Email Service
RESEND_API_KEY=re_your_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key

# CORS
CORS_ORIGINS=http://localhost:3100,http://localhost:3000
```

---

## 🔍 Verification

### Check Services
```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f app

# Check health
curl http://localhost:3100/health
```

### Test Endpoints

#### Admin Login
```bash
curl -X POST http://localhost:3100/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aaron.com","password":"admin123"}'
```

#### Operator Login
```bash
curl -X POST http://localhost:3100/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@test.com","password":"Operator123!"}'
```

#### Test Protected Endpoint
```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/admin/users
```

---

## 🚢 VPS Deployment

### 1. Prepare VPS
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Clone repository
git clone https://github.com/Rief3550/Aaron-serv-Backend-Def.git
cd Aaron-serv-Backend-Def
```

### 2. Setup Database
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create user and database
sudo -u postgres psql
CREATE USER root WITH PASSWORD 'your-secure-password';
CREATE DATABASE postgres OWNER root;
\c postgres
CREATE SCHEMA auth;
CREATE SCHEMA operations;
CREATE SCHEMA tracking;
\q
```

### 3. Configure Environment
```bash
# Create .env file
cp .env.example .env
nano .env

# Update with production values:
# - DATABASE_URL with VPS postgres
# - JWT secrets
# - API keys
```

### 4. Deploy
```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec app sh -c \
  "cd backend/services/auth-service && npx prisma migrate deploy"

# Seed database
docker compose -f docker-compose.prod.yml exec app sh -c \
  "cd backend/services/auth-service && pnpm prisma:seed"

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### 5. Setup Nginx (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛠️ Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs app

# Common issues:
# - Database connection failed → Check DATABASE_URL
# - Port already in use → Change port mapping
# - Missing environment variables → Check .env file
```

### Database Connection Error
```bash
# Test database connection
PGPASSWORD=Ollieconverse123 psql -h localhost -U root -d postgres

# If fails:
# - Check PostgreSQL is running
# - Check user/password
# - Check schemas exist
```

### Prisma Client Errors
```bash
# Regenerate Prisma clients
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Service Not Responding
```bash
# Check if service is running inside container
docker compose exec app ps aux | grep node

# Restart specific service (requires manual intervention)
docker compose restart app
```

---

## 📝 Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Backup Database
```bash
# Backup all schemas
PGPASSWORD=Ollieconverse123 pg_dump -h localhost -U root \
  -d postgres -n auth -n operations -n tracking \
  > backup_$(date +%Y%m%d).sql

# Restore
PGPASSWORD=Ollieconverse123 psql -h localhost -U root \
  -d postgres < backup_20251125.sql
```

### View Logs
```bash
# All logs
docker compose logs -f

# Specific service logs (inside container)
docker compose exec app tail -f /app/logs/auth-service.log
```

### Clean Up
```bash
# Stop and remove containers
docker compose down

# Remove volumes (CAUTION: deletes data)
docker compose down -v

# Remove images
docker rmi aaron-serv-backend-def-app
```

---

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **NestJS Documentation**: https://docs.nestjs.com
- **Docker Documentation**: https://docs.docker.com
- **Next.js Documentation**: https://nextjs.org/docs

---

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review logs: `docker compose logs -f`
3. Check GitHub Issues
4. Contact development team
