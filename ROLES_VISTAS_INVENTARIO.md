# 📋 Inventario de Vistas y Roles - BackOffice Web

## 🎯 Roles Definidos

### ADMIN (Administrador)
- **Descripción**: Acceso completo al sistema, incluye todas las funciones de OPERATOR + funciones administrativas exclusivas
- **Cantidad**: Solo 1 usuario

### OPERATOR (Operador)
- **Descripción**: Acceso a funciones operativas básicas, gestión de órdenes y clientes
- **Cantidad**: 1-2 usuarios (gestionados por ADMIN)

---

## 📊 Listado Completo de Vistas

### ✅ VISTAS COMUNES (ADMIN + OPERATOR)

| Vista | Path | Descripción | Roles |
|-------|------|-------------|-------|
| **Dashboard** | `/dashboard` | Vista general con KPIs, mapa y últimas órdenes | ADMIN, OPERATOR |
| **Solicitudes** | `/solicitudes` | Gestión de solicitudes del cliente | ADMIN, OPERATOR |
| **Órdenes de Trabajo** | `/ordenes` | Lista y gestión de órdenes de trabajo | ADMIN, OPERATOR |
| **Órdenes Detalle** | `/ordenes/:id` | Detalle de una orden específica | ADMIN, OPERATOR |
| **Cuadrillas** | `/cuadrillas` | Vista operativa de cuadrillas | ADMIN, OPERATOR |
| **Planes** | `/planes` | Lista de planes disponibles | ADMIN, OPERATOR |
| **Clientes** | `/clientes` | Lista de clientes | ADMIN, OPERATOR |
| **Cliente Detalle** | `/clientes/:id` | Ficha completa del cliente | ADMIN, OPERATOR |
| **Mapa** | `/mapa` | Mapa de operaciones con propiedades | ADMIN, OPERATOR |
| **Métricas** | `/metricas` | Métricas y estadísticas generales | ADMIN, OPERATOR |

**Total Vistas OPERATOR: 10 vistas**

---

### 🔐 VISTAS SOLO ADMIN

| Vista | Path | Descripción | Roles |
|-------|------|-------------|-------|
| **Panel Admin** | `/admin` | Dashboard administrativo con KPIs financieros | ADMIN |
| **Gestión Usuarios** | `/admin/usuarios` | CRUD completo de usuarios del sistema | ADMIN |
| **Gestión Cuadrillas** | `/admin/cuadrillas` | CRUD completo de cuadrillas | ADMIN |
| **Tipos de Trabajo** | `/admin/tipos-trabajo` | CRUD completo de tipos de trabajo | ADMIN |
| **Gestión Planes** | `/admin/planes` | CRUD completo de planes de suscripción | ADMIN |
| **Suscripciones** | `/admin/suscripciones` | Gestión avanzada de suscripciones | ADMIN |
| **Configuración** | `/configuracion` | Configuración general del sistema | ADMIN |

**Total Vistas ADMIN exclusivas: 7 vistas**

**Total Vistas ADMIN (común + exclusivas): 17 vistas**

---

## 🔍 Análisis de Acceso por Rol

### OPERATOR (Operador)
```
Acceso a:
✅ Dashboard (vista operativa)
✅ Solicitudes
✅ Órdenes de Trabajo (ver, asignar, cambiar estados)
✅ Cuadrillas (ver estado, asignar a órdenes)
✅ Planes (ver planes disponibles)
✅ Clientes (ver y gestionar)
✅ Mapa de operaciones
✅ Métricas generales

NO tiene acceso a:
❌ CRUD de usuarios
❌ CRUD de cuadrillas (solo visualización)
❌ CRUD de tipos de trabajo
❌ CRUD de planes (solo visualización)
❌ Gestión avanzada de suscripciones
❌ Panel Admin
❌ Configuración del sistema
```

### ADMIN (Administrador)
```
Acceso a TODO:
✅ Todas las vistas de OPERATOR (10 vistas)
✅ Panel Admin (dashboard financiero)
✅ CRUD Usuarios
✅ CRUD Cuadrillas
✅ CRUD Tipos de Trabajo
✅ CRUD Planes
✅ Gestión Avanzada Suscripciones
✅ Configuración del Sistema

Total: 17 vistas
```

---

## 🔐 Estado Actual de Protecciones

### ✅ Páginas con Protección Implementada

| Página | Protección | Estado |
|--------|------------|--------|
| `/admin` | ❌ No tiene | ⚠️ **FALTA** |
| `/admin/usuarios` | ✅ hasRole('ADMIN') | ✅ OK |
| `/admin/cuadrillas` | ✅ hasRole('ADMIN') | ✅ OK |
| `/admin/tipos-trabajo` | ✅ hasRole('ADMIN') | ✅ OK |
| `/admin/planes` | ✅ hasRole('ADMIN') | ✅ OK |
| `/admin/suscripciones` | ✅ hasRole('ADMIN') | ✅ OK |
| `/configuracion` | ✅ hasRole('ADMIN') | ✅ OK |

### ⚠️ Páginas SIN Protección Explicita

| Página | Roles Esperados | Acción |
|--------|-----------------|--------|
| `/dashboard` | ADMIN, OPERATOR | ✅ Sidebar filtra, OK |
| `/solicitudes` | ADMIN, OPERATOR | ✅ Sidebar filtra, OK |
| `/ordenes` | ADMIN, OPERATOR | ✅ Sidebar filtra, OK |
| `/cuadrillas` | ADMIN, OPERATOR | ⚠️ Verificar protección backend |
| `/planes` | ADMIN, OPERATOR | ⚠️ Verificar protección backend |
| `/clientes` | ADMIN, OPERATOR | ⚠️ Verificar protección backend |
| `/mapa` | ADMIN, OPERATOR | ⚠️ **NO está en sidebar** |
| `/metricas` | ADMIN, OPERATOR | ⚠️ **NO está en sidebar** |

---

## 📝 Items del Menú (Sidebar)

### Estado Actual del Sidebar

```typescript
// ✅ VISTAS COMUNES (todos los roles)
- Dashboard (/dashboard)
- Solicitudes (/solicitudes)

// ✅ VISTAS OPERATOR + ADMIN
- Órdenes de Trabajo (/ordenes) - roles: ['ADMIN', 'OPERATOR']
- Cuadrillas (/cuadrillas) - roles: ['ADMIN', 'OPERATOR']
- Planes (/planes) - roles: ['ADMIN', 'OPERATOR']
- Clientes (/clientes) - roles: ['ADMIN', 'OPERATOR']

// ✅ VISTAS SOLO ADMIN
- --- Administración --- (separador)
- Panel Admin (/admin) - roles: ['ADMIN']
- Gestión Usuarios (/admin/usuarios) - roles: ['ADMIN']
- Gestión Cuadrillas (/admin/cuadrillas) - roles: ['ADMIN']
- Tipos de Trabajo (/admin/tipos-trabajo) - roles: ['ADMIN']
- Gestión Planes (/admin/planes) - roles: ['ADMIN']
- Suscripciones (/admin/suscripciones) - roles: ['ADMIN']

// ❌ FALTANTES EN SIDEBAR
- Mapa (/mapa) - Debe estar visible para ADMIN y OPERATOR
- Métricas (/metricas) - Debe estar visible para ADMIN y OPERATOR
- Configuración (/configuracion) - Debe estar solo para ADMIN
```

---

## 🎯 Recomendaciones y Acciones Necesarias

### 1. ✅ Sidebar - Agregar páginas faltantes
- [ ] Agregar "Mapa" al sidebar (ADMIN, OPERATOR)
- [ ] Agregar "Métricas" al sidebar (ADMIN, OPERATOR)
- [ ] Agregar "Configuración" al sidebar (solo ADMIN)

### 2. ✅ Protecciones en Páginas
- [ ] Agregar protección hasRole('ADMIN') en `/admin`
- [ ] Verificar que páginas operativas tengan protecciones en el backend

### 3. ✅ Limpieza
- [ ] Eliminar página duplicada `/usuarios` (existe `/admin/usuarios`)
- [ ] Verificar rutas de operaciones duplicadas (`/operaciones/*` vs `/ordenes/*`)

---

## 📌 Resumen Ejecutivo

| Métrica | ADMIN | OPERATOR |
|---------|-------|----------|
| **Total Vistas** | 17 | 10 |
| **Vistas Exclusivas** | 7 | 0 |
| **Vistas Comunes** | 10 | 10 |
| **Items en Sidebar** | 13 | 6 |
| **Páginas con Protección** | 7 | 0 (filtrado por sidebar) |

**Estado General**: ✅ **BUENO** - Faltan pequeños ajustes en sidebar y protecciones

