# 📋 Plan de Mejoras UI/UX - Frontend Aaron Backoffice

## Objetivo
Mejorar la experiencia visual del frontend adaptando componentes de referencia sin copiar, tomando la estructura y esencia del diseño.

---

## 🎯 Componentes a Mejorar/Implementar

### 1. **Gráfico de Línea (ChartLine)**
**Estado:** Existe pero básico  
**Ubicación actual:** `components/operator/OrdersStatusChart.tsx`  
**Mejoras necesarias:**
- Adaptar diseño de ChartLine de referencia
- Mejorar colores según paleta Aaron
- Optimizar tipografía y espaciado
- Mantener eje temporal y funcionalidad actual

**Páginas que lo usan:**
- Dashboard (`app/(app)/dashboard/page.tsx`)

---

### 2. **Budget Cards por Estado**
**Estado:** NO existe  
**Implementar:** Componente nuevo para mostrar budgets con colores por estado

**Usos:**
- Órdenes: PENDIENTE, ASIGNADA, EN_PROGRESO, FINALIZADA, CANCELADA
- Suscripciones: ACTIVE, PAST_DUE, SUSPENDED, CANCELLED
- Usuarios: ACTIVE, INACTIVE, BAJA

**Páginas que necesitan:**
- Dashboard (resumen de estados)
- Órdenes (filtros visuales por estado)
- Suscripciones (resumen de estados)
- Usuarios (si aplica)

---

### 3. **Tablas Mejoradas**
**Estado:** Existen pero básicas  
**Mejoras necesarias:**
- Adaptar diseño de tabla de referencia
- Mejorar hover states
- Optimizar espaciado y tipografía
- Integrar con paginación

**Páginas con tablas:**
- `app/(app)/ordenes/page.tsx`
- `app/(app)/admin/suscripciones/page.tsx`
- `app/(app)/usuarios/page.tsx` (vacía)
- Dashboard (tabla de últimas órdenes)

---

### 4. **Paginación Frontend**
**Estado:** NO existe  
**Implementar:** Componente reutilizable de paginación

**Páginas que necesitan:**
- Órdenes
- Suscripciones
- Usuarios
- Solicitudes (cuando se implemente)

---

### 5. **Modales Mejorados**
**Estado:** Existe `StatusModal.tsx` básico  
**Mejoras necesarias:**
- Adaptar diseño de modales de referencia
- Mejorar animaciones y transiciones
- Optimizar estructura y espaciado

---

### 6. **CRUD de Usuarios**
**Estado:** Página vacía  
**Implementar:** Formularios, validación, tablas con CRUD completo

**Componentes necesarios:**
- Formulario de creación/edición
- Tabla de usuarios con acciones
- Modales de confirmación
- Budget cards para estados de usuario

**Páginas:**
- `app/(app)/usuarios/page.tsx`
- `app/(app)/admin/usuarios/page.tsx` (si es diferente)

---

### 7. **Cards de Métricas Mejoradas**
**Estado:** Existen `MetricCard` y `KPIcards`  
**Mejoras necesarias:**
- Adaptar diseño de cards de referencia
- Mejorar sombras y espaciado
- Optimizar tipografía y colores

---

### 8. **Gráficos Donut (Opcional)**
**Estado:** NO existe  
**Implementar si se requiere:** Para distribuciones porcentuales

---

## 📝 Orden Recomendado de Implementación

### Fase 1: Componentes Base
1. ✅ **Budget Cards** - Base para estados (se usa en múltiples lugares)
2. ✅ **Paginación** - Base reutilizable

### Fase 2: Mejoras Visuales
3. ✅ **Gráfico de Línea** - Mejorar diseño existente
4. ✅ **Cards de Métricas** - Refinar diseño

### Fase 3: Tablas y Listados
5. ✅ **Tablas Mejoradas** - Aplicar a todas las páginas
6. ✅ **CRUD de Usuarios** - Implementación completa

### Fase 4: Elementos Interactivos
7. ✅ **Modales Mejorados** - Refinar y aplicar

---

## 🎨 Principios de Adaptación

✅ **SÍ hacer:**
- Tomar estructura y layout
- Mantener sombras y efectos visuales similares
- Adaptar colores a paleta Aaron
- Mejorar tipografía según diseño actual
- Mantener funcionalidad existente

❌ **NO hacer:**
- Copiar nombres de variables/clases exactas
- Copiar colores exactos del proyecto de referencia
- Copiar textos/labels exactos
- Implementar sin entender la estructura

---

## 📦 Dependencias Actuales

- ✅ `chart.js` v4.4.0
- ✅ `react-chartjs-2` v5.2.0
- ✅ `next` 16.0.3
- ✅ `react` 19.2.0
- ✅ Tailwind CSS v4

---

## 🚀 Próximos Pasos

1. **Pasar componentes de referencia uno por uno**
2. **Adaptar según este plan**
3. **Revisar y validar diseño**
4. **Aplicar a todas las páginas correspondientes**

---

## 📍 Notas Importantes

- Todos los componentes deben seguir Clean Architecture
- Mantener separación de concerns (Presentation/Logic)
- Reutilizar componentes donde sea posible
- Optimizar rendimiento y accesibilidad

