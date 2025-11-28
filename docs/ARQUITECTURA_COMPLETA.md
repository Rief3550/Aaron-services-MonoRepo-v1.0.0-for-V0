# 🏗️ Arquitectura Completa del Sistema

## 🎯 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                      USUARIO                            │
│              http://localhost:3100                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                FRONTEND (Next.js 16)                    │
│                  Puerto: 3100                           │
│            Container: aaron_frontend                     │
│                                                         │
│  • Proxy /api/* → API Gateway                          │
│  • SSR/SSG de páginas                                  │
│  • Client components con React 19                      │
└─────────────────────────────────────────────────────────┘
                         ↓
              /api/* requests van a:
                         ↓
┌─────────────────────────────────────────────────────────┐
│               API GATEWAY (NestJS)                      │
│                  Puerto: 3000                           │
│            Container: aaron_gateway                      │
│                                                         │
│  • Punto de entrada único                              │
│  • Rate limiting                                        │
│  • CORS configurado                                     │
│  • Proxy a microservicios                              │
└─────────────────────────────────────────────────────────┘
           ↓                ↓                ↓
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │   AUTH   │     │   OPS    │     │  TRACK   │
    │  SERVICE │     │ SERVICE  │     │ SERVICE  │
    │          │     │          │     │          │
    │  :3001   │     │  :3002   │     │  :3003   │
    │          │     │          │     │          │
    │ aaron_   │     │ aaron_   │     │ aaron_   │
    │ auth     │     │operations│     │ tracking │
    └──────────┘     └──────────┘     └──────────┘
           ↓                ↓                ↓
           └────────────────┴────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │    PostgreSQL 18.0 (LOCAL)     │
        │         Puerto: 5432           │
        │    Usuario: root               │
        │                                │
        │  Schemas:                      │
        │  • auth                        │
        │  • operations                  │
        │  • tracking                    │
        └────────────────────────────────┘
                         ↑
           Todos los servicios usan:
        host.docker.internal:5432

           ┌────────────────┐
           │  Redis (Docker)│
           │  Puerto: 6379  │
           │                │
           │  aaron_redis   │
           └────────────────┘
                  ↑
    Usado por todos los servicios
    para cache y pub/sub
```

## 🌐 Flujo de una Request

### Ejemplo: Login de Usuario

```
1. Usuario → Frontend
   POST http://localhost:3100/api/auth/login
   { email, password }

2. Frontend → API Gateway (interno)
   POST http://api-gateway:3000/auth/login

3. API Gateway → Auth Service
   POST http://auth-service:3001/auth/login

4. Auth Service → PostgreSQL Local
   Query: SELECT * FROM users WHERE email = ?
   (usando host.docker.internal:5432)

5. Auth Service → Redis
   Guardar sesión/token en cache

6. Respuesta Auth → API Gateway
   { accessToken, refreshToken, user }

7. Respuesta API Gateway → Frontend
   { accessToken, refreshToken, user }

8. Frontend → Usuario
   Guarda token, redirect a dashboard
```

## 📊 Puertos y Servicios

| Servicio | Puerto Host | Puerto Container | URL Externa | URL Interna |
|----------|-------------|------------------|-------------|-------------|
| **Frontend** | 3100 | 3100 | http://localhost:3100 | http://frontend:3100 |
| **API Gateway** | 3000 | 3000 | http://localhost:3000 | http://api-gateway:3000 |
| **Auth Service** | 3001 | 3001 | http://localhost:3001 | http://auth-service:3001 |
| **Operations Service** | 3002 | 3002 | http://localhost:3002 | http://operations-service:3002 |
| **Tracking Service** | 3003 | 3003 | http://localhost:3003 | http://tracking-service:3003 |
| **Redis** | 6379 | 6379 | localhost:6379 | redis:6379 |
| **PostgreSQL** | 5432 | - | localhost:5432 | host.docker.internal:5432 |

## 🔄 Comunicación Entre Servicios

### Frontend ↔ Backend

```typescript
// En el frontend (Next.js)
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Next.js reescribe /api/* a http://api-gateway:3000/*
```

### API Gateway ↔ Microservicios

```typescript
// En API Gateway
@Controller('auth')
export class AuthProxyController {
  constructor(private httpService: HttpService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.httpService.post(
      'http://auth-service:3001/auth/login',
      loginDto
    );
  }
}
```

### Microservicios ↔ PostgreSQL

```typescript
// En cualquier servicio
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://root:devAS.team@host.docker.internal:5432/postgres?schema=auth'
    }
  }
});
```

### Microservicios ↔ Redis

```typescript
// En cualquier servicio
const redis = new Redis({
  host: 'redis',  // nombre del servicio en Docker
  port: 6379
});
```

## 🔐 Seguridad y Autenticación

### Flow de Autenticación

```
1. Login
   Frontend → API Gateway → Auth Service
   
2. Auth Service genera JWT
   - Access Token (15 min)
   - Refresh Token (7 días)
   
3. Token guardado
   - Frontend: localStorage/cookie
   - Backend: Redis (para invalidación)
   
4. Requests subsecuentes
   Frontend envía: Authorization: Bearer <token>
   API Gateway valida token
   Si válido → forward a microservicio
   Si inválido → 401 Unauthorized
   
5. Refresh Token
   Cuando access expira → usar refresh
   Auth Service valida refresh token
   Genera nuevo access token
```

## 🗄️ Base de Datos

### Schemas Separados

```sql
-- Mismo PostgreSQL, diferentes schemas
postgres=# \dn
    List of schemas
    Name     |  Owner   
-------------+----------
 auth        | root
 operations  | root
 tracking    | root
 public      | root
```

### Ventajas de Schemas vs DBs Separadas

✅ **Schemas Separados:**
- Una conexión para todos
- Fácil hacer queries cross-schema si es necesario
- Menos overhead
- Backups más simples

❌ **DBs Separadas:**
- Múltiples conexiones
- No se pueden hacer queries entre DBs fácilmente
- Más overhead

## 🔄 Estado y Cache

### Redis para:

1. **Sessions**
   ```typescript
   // Guardar sesión de usuario
   await redis.set(`session:${userId}`, JSON.stringify(session), 'EX', 3600);
   ```

2. **Cache de Queries**
   ```typescript
   // Cache de datos frecuentes
   const cached = await redis.get(`user:${userId}`);
   if (!cached) {
     const user = await prisma.user.findUnique({ where: { id: userId } });
     await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 300);
   }
   ```

3. **Pub/Sub para Real-time**
   ```typescript
   // Publicar eventos
   await redis.publish('order-updates', JSON.stringify({
     orderId: '123',
     status: 'completed'
   }));
   ```

4. **Rate Limiting**
   ```typescript
   // Limitar requests por IP
   const count = await redis.incr(`rate:${ip}`);
   if (count === 1) await redis.expire(`rate:${ip}`, 60);
   if (count > 100) throw new TooManyRequestsException();
   ```

## 📁 Estructura de Archivos

```
Aaron-serv-Backend-Def/
├── Dockerfile.backend          # Dockerfile para microservicios
├── Dockerfile.frontend         # Dockerfile para Next.js
├── docker-compose.yml          # Orquestación completa
├── docker-start.sh             # Script de inicio
│
├── backend/
│   ├── services/              # 4 Microservicios
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── operations-service/
│   │   └── tracking-service/
│   └── shared/                # Librerías compartidas
│       ├── common/
│       ├── auth/
│       ├── mail/
│       └── prisma/
│
├── frontend/
│   └── web/                   # Next.js 16 App
│       ├── app/               # App Router
│       ├── components/
│       └── next.config.ts     # Con proxy configurado
│
└── shared/
    └── types/                 # Tipos compartidos TS
```

## 🚀 Comandos de Desarrollo

### Levantar Todo

```bash
# Método 1: Script automático
./docker-start.sh

# Método 2: Manual
docker compose build
docker compose up -d
```

### Ver Logs

```bash
# Todos
docker compose logs -f

# Solo frontend
docker compose logs -f frontend

# Solo backend
docker compose logs -f api-gateway auth-service operations-service tracking-service
```

### Rebuild Después de Cambios

```bash
# Rebuild frontend
docker compose up -d --build frontend

# Rebuild un microservicio
docker compose up -d --build auth-service

# Rebuild todo
docker compose up -d --build
```

## 🧪 Testing de la Arquitectura

```bash
# 1. Verificar que todo esté up
docker compose ps

# 2. Health check de cada servicio
curl http://localhost:3100        # Frontend
curl http://localhost:3000/health # API Gateway
curl http://localhost:3001/health # Auth
curl http://localhost:3002/health # Operations
curl http://localhost:3003/health # Tracking

# 3. Test de proxy frontend → backend
curl http://localhost:3100/api/auth/health

# 4. Test directo a API Gateway
curl http://localhost:3000/auth/health

# 5. Ver logs en tiempo real
docker compose logs -f
```

## 📚 Documentación Adicional

- `QUICK_START.md` - Inicio rápido
- `docs/DOCKER_COMPLETE_GUIDE.md` - Guía completa de Docker
- `docs/START_DEVELOPMENT.md` - Desarrollo local (sin Docker)

---

**Arquitectura completa funcionando.** Frontend → API Gateway → Microservicios → PostgreSQL Local. 🚀

