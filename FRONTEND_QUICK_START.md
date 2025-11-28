# 🎨 Frontend - Guía Rápida

## 🚀 Correr el Frontend

```bash
cd frontend/web
pnpm dev
```

El frontend estará disponible en: **http://localhost:3000**

## 📋 Prerequisitos

1. **Backend corriendo** (opcional, pero recomendado para funcionalidad completa)
2. **Node.js 20+** instalado
3. **pnpm** instalado

## ⚙️ Variables de Entorno

El frontend necesita estas variables (en `.env.local` o `.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu_map_id
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Correr build de producción
pnpm start

# Linter
pnpm lint
```

## 🐛 Troubleshooting

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo
- Verifica que `NEXT_PUBLIC_API_URL` apunte al API Gateway (puerto 3001)

### Error de autenticación
- Verifica que el auth-service esté corriendo
- Verifica que las cookies/localStorage estén habilitadas

### Error de Google Maps
- Verifica que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurada
- Verifica que la API key tenga permisos para Maps JavaScript API

## 📁 Estructura del Frontend

```
frontend/web/
├── app/                    # Páginas de Next.js (App Router)
│   ├── (app)/             # Rutas protegidas (requieren auth)
│   │   ├── dashboard/
│   │   ├── ordenes/
│   │   ├── clientes/
│   │   └── admin/
│   ├── login/             # Página de login
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React
├── lib/                   # Utilidades y servicios
│   ├── auth/             # Sistema de autenticación
│   ├── api/              # Cliente API
│   └── ...
└── public/               # Archivos estáticos
```

## 🔐 Roles y Acceso

- **ADMIN**: Acceso completo (17 vistas)
- **OPERATOR**: Solo vistas operativas (10 vistas)

El sidebar filtra automáticamente según el rol del usuario.

## 📝 Notas

- El frontend usa Next.js 16 con App Router
- Autenticación manejada con Zustand + localStorage
- API Client configurado para comunicarse con el API Gateway

