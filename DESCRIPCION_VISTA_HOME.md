# 📋 Descripción Detallada: Vista Home (Dashboard)

## 🎯 Visión General

La vista **Home** o **Dashboard** es la página principal del backoffice de Aaron Services. Se encuentra en la ruta `/dashboard` y proporciona una vista panorámica de todas las operaciones del sistema. Está diseñada principalmente para operadores y administradores que necesitan monitorear el estado de órdenes, cuadrillas, métricas y actividad en tiempo real.

**Archivo Principal:** `frontend/web/app/(app)/dashboard/page.tsx`

---

## 🏗️ Arquitectura de la Vista

### Estructura General

La vista Home está compuesta por las siguientes secciones principales:

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER (Layout)                         │
│  - Título: "Dashboard Operativo"                            │
│  - Subtítulo: "Vista general de operaciones"                │
│  - Botón: "Actualizar" (refresh manual)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  1. KPI CARDS (4 tarjetas)                  │
│  - Reclamos Totales                                         │
│  - Incidentes Hoy                                           │
│  - Visitas Hoy                                              │
│  - Órdenes en Curso                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             2. LAYOUT GRID (2 columnas en XL)               │
│  ┌──────────────────────┬──────────────────────┐           │
│  │  Estados de Órdenes  │  Evolución Semanal   │           │
│  │  (Matriz de estados) │  (Gráfico de líneas) │           │
│  └──────────────────────┴──────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             3. MAPA DE ÓRDENES Y CUADRILLAS                 │
│  - Google Maps interactivo                                  │
│  - Marcadores de órdenes (iconos de casa)                   │
│  - Marcadores de cuadrillas (iconos de equipo)              │
│  - Popups informativos al hacer clic                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             4. TABLA DE ÚLTIMAS ÓRDENES                     │
│  - Columnas: ID/Fecha, Servicio, Dirección, Operador, Estado│
│  - Badges interactivos de estado (clickeables)              │
│  - Link "Ver todas" → /ordenes                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│        5. MODAL DE CAMBIO DE ESTADO (condicional)           │
│  - Se abre al hacer clic en badge de estado                 │
│  - Permite cambiar estado de orden                          │
│  - Formulario dinámico según transición                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes Individuales

### 1️⃣ **Header de la Vista**

```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Dashboard Operativo</h1>
    <p className="mt-1 text-sm text-gray-500">Vista general de operaciones</p>
  </div>
  <button
    onClick={loadDashboardData}
    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
  >
    Actualizar
  </button>
</div>
```

**Características:**
- Título principal: "Dashboard Operativo"
- Subtítulo descriptivo
- Botón de refresh manual para recargar todos los datos
- Diseño horizontal con espacio entre elementos

---

### 2️⃣ **KPI Cards** (`KPIcards` Component)

**Archivo:** `frontend/web/components/operator/KPIcards.tsx`

**Estructura Visual:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📄 Reclamos  │ ⚠️ Incidentes│ ✅ Visitas   │ 📅 Órdenes   │
│   Totales    │    Hoy       │    Hoy       │  en Curso    │
│              │              │              │              │
│     45       │      12      │      8       │     23       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Características:**

1. **Grid Responsivo:**
   - 1 columna en móvil
   - 2 columnas en tablet (sm)
   - 4 columnas en desktop (lg)

2. **Cuatro Tarjetas KPI:**

   a) **Reclamos Totales**
   - **Icono:** 📄 DocumentIcon (SVG inline)
   - **Color:** Azul (`bg-blue-500`, `border-blue-100`)
   - **Endpoint:** `/metrics/operator/summary` → `reclamosTotales`
   - **Descripción:** Total acumulado de reclamos registrados

   b) **Incidentes Hoy**
   - **Icono:** ⚠️ AlertIcon (triángulo de advertencia)
   - **Color:** Naranja (`bg-orange-500`, `border-orange-100`)
   - **Endpoint:** `/metrics/operator/summary` → `incidentesHoy`
   - **Descripción:** Número específico de incidentes ocurridos hoy

   c) **Visitas Hoy**
   - **Icono:** ✅ CheckIcon (círculo con check)
   - **Color:** Esmeralda (`bg-emerald-500`, `border-emerald-100`)
   - **Endpoint:** `/metrics/operator/summary` → `visitasHoy`
   - **Descripción:** Cantidad de visitas realizadas hoy

   d) **Órdenes en Curso**
   - **Icono:** 📅 CalendarIcon
   - **Color:** Púrpura (`bg-purple-500`, `border-purple-100`)
   - **Endpoint:** `/metrics/operator/summary` → `ordenesPorEstado['EN_PROGRESO']`
   - **Descripción:** Órdenes actualmente en estado "EN_PROGRESO"

3. **Diseño de cada Tarjeta:**
   - **Tamaño mínimo:** 120px de altura
   - **Estructura interna:**
     ```
     ┌─────────────────────────┐
     │ [Icono Circular] [Texto]│
     │   └─ Colored BG         │
     │                        │
     │   Título (small, gray)  │
     │   Valor (2xl, bold)     │
     └─────────────────────────┘
     ```
   - **Hover Effect:** Elevación suave (`hover:shadow-md hover:-translate-y-1`)
   - **Transiciones:** Duración 300ms

4. **Estados de Carga:**
   - **Skeleton Loading:** Muestra 4 tarjetas con animación pulse mientras carga
   - **Valores por defecto:** Muestra `0` si no hay datos (nunca oculta las cards)
   - **Manejo de errores:** En caso de error, muestra `0` en lugar de datos mock

5. **Datos del Backend:**
   ```typescript
   interface Summary {
     reclamosTotales: number;
     incidentesHoy: number;
     visitasHoy: number;
     ordenesPorEstado: Record<string, number>;
     incidentesDiarios?: { fecha: string; cantidad: number }[];
     visitasDiarias?: { fecha: string; cantidad: number }[];
   }
   ```

---

### 3️⃣ **Sección de Estados y Gráfico** (Layout Grid)

#### A) **Matriz de Estados de Órdenes** (Columna Izquierda)

**Componente:** `BudgetCard` (de `@/components/ui/budget-card`)

**Estructura Visual:**
```
┌──────────────────────────────────────────┐
│  Estado de Órdenes                       │
│  Actualizado en tiempo real              │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ ⏰ PENDIENTE          [15]       │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────┬──────────────┐        │
│  │ 👤 ASIGNADA  │ ▶ EN_PROGRESO│        │
│  │    [8]       │    [23]      │        │
│  └──────────────┴──────────────┘        │
│                                          │
│  ┌──────────────┬──────────────┐        │
│  │ ✅ FINALIZADA│ ❌ CANCELADA  │        │
│  │    [45]      │    [3]       │        │
│  └──────────────┴──────────────┘        │
│                                          │
└──────────────────────────────────────────┘
```

**Características:**

1. **Tarjeta Principal:**
   - Título: "Estado de Órdenes"
   - Subtítulo: "Actualizado en tiempo real"
   - Fondo blanco con bordes redondeados (`rounded-3xl`)
   - Sombra suave: `shadow-[0_20px_40px_rgba(38,57,77,0.08)]`
   - Padding: `p-6`

2. **Card PENDIENTE (Destacada):**
   - **Posición:** Arriba, ancho completo
   - **Estilo:**
     - Fondo: `bg-[#FFF3E2]` (amarillo claro)
     - Texto: `text-[#F9782E]` (naranja)
     - Icono: ⏰ ClockIcon
   - **Click:** Redirige a `/ordenes?state=PENDIENTE`
   - **Contador:** Número de órdenes pendientes

3. **Grid de 4 Estados (2x2):**
   - **ASIGNADA:**
     - Fondo: `bg-[#E8F0FF]` (azul claro)
     - Texto: `text-[#294C75]` (azul oscuro)
     - Icono: 👤 UserIcon
     - Click → `/ordenes?state=ASIGNADA`

   - **EN_PROGRESO:**
     - Fondo: `bg-[#F5E8FF]` (púrpura claro)
     - Texto: `text-[#8F4CF9]` (púrpura)
     - Icono: ▶ PlayIcon
     - Click → `/ordenes?state=EN_PROGRESO`

   - **FINALIZADA:**
     - Fondo: `bg-[#E6F8F0]` (verde claro)
     - Texto: `text-[#22A06B]` (verde)
     - Icono: ✅ CheckCircleIcon
     - Click → `/ordenes?state=FINALIZADA`

   - **CANCELADA:**
     - Fondo: `bg-[#FFEDEE]` (rojo claro)
     - Texto: `text-[#E24343]` (rojo)
     - Icono: ❌ XCircleIcon
     - Click → `/ordenes?state=CANCELADA`

4. **Diseño de cada BudgetCard:**
   - **Estructura:**
     ```
     ┌────────────────────────────────────┐
     │ [Icono en círculo] [Texto]  [Count]│
     │   14x14 rounded-2xl                │
     └────────────────────────────────────┘
     ```
   - **Hover:** Elevación y sombra aumentada
   - **Click:** Cursor pointer, redirige a filtro de órdenes

5. **Datos:**
   - Los contadores se calculan filtrando las órdenes por estado
   - Se actualizan en tiempo real al cargar datos

---

#### B) **Gráfico de Evolución Semanal** (Columna Derecha)

**Componente:** `OrdersStatusChart` (de `@/components/operator/OrdersStatusChart`)

**Estructura Visual:**
```
┌──────────────────────────────────────────┐
│  Evolución semanal                       │
│              [Día] [Mes] [Año]           │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │    ┌─ Pendiente (amarillo)       │   │
│  │   ╱│                              │   │
│  │  ╱ │  ┌─ En curso (azul)         │   │
│  │ ╱  │ ╱                            │   │
│  │╱   │╱    ┌─ Finalizado (verde)    │   │
│  │    │    ╱                          │   │
│  │    └───╱  ┌─ Cancelado (rojo)     │   │
│  │           ╱                        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Lun Mar Mié Jue Vie Sáb Dom            │
└──────────────────────────────────────────┘
```

**Características:**

1. **Configuración del Gráfico:**
   - **Tipo:** Gráfico de líneas (Chart.js Line Chart)
   - **Altura:** 320px (`h-[320px]`)
   - **Responsive:** Se adapta al contenedor
   - **Plugin:** `chartjs-plugin-datalabels` para mostrar valores en puntos

2. **Filtros de Tiempo:**
   - **Día:** Muestra datos diarios (Lun, Mar, Mié, etc.)
   - **Mes:** Muestra datos mensuales (Ene 2024, Feb 2024, etc.)
   - **Año:** Muestra datos anuales
   - **Botones:** Pills redondeados con estado activo destacado

3. **Cuatro Líneas de Datos:**

   a) **Pendiente:**
   - Color: `#eab308` (Yellow-500)
   - Gradiente de fondo: De amarillo 40% opacidad a transparente
   - Puntos: Círculos amarillos sin borde

   b) **En curso:**
   - Color: `#3b82f6` (Blue-500)
   - Gradiente de fondo: De azul 40% opacidad a transparente
   - Puntos: Círculos azules sin borde

   c) **Finalizado:**
   - Color: `#10b981` (Emerald-500)
   - Gradiente de fondo: De verde 40% opacidad a transparente
   - Puntos: Círculos verdes sin borde

   d) **Cancelado:**
   - Color: `#ef4444` (Red-500)
   - Gradiente de fondo: De rojo 40% opacidad a transparente
   - Puntos: Círculos rojos sin borde

4. **Características del Gráfico:**
   - **Curva suave:** `tension: 0.4`
   - **Área rellena:** `fill: true` con gradiente
   - **Tooltips:** Información al hover (fecha, estado, cantidad)
   - **Leyenda:** Arriba con círculos de colores
   - **Labels en puntos:** Muestran valores numéricos (si > 0)
   - **Eje X:** Muestra días/meses según filtro (sin grid)
   - **Eje Y:** Oculto visualmente pero con rango dinámico

5. **Datos del Backend:**
   ```typescript
   interface SeriesData {
     periodo: string;        // "Lun", "2024-01", "2024"
     pendiente: number;
     en_curso: number;       // EN_PROGRESO
     finalizado: number;     // FINALIZADA
     cancelado: number;      // CANCELADA
   }
   ```
   - **Endpoint:** `/metrics/operator/orders-by-status-series?groupBy={day|month|year}`

6. **Estados de Carga:**
   - **Skeleton:** Animación de gráfico fantasma mientras carga
   - **Sin datos:** Mensaje "No hay datos disponibles"
   - **Error:** Mensaje de error en rojo

---

### 4️⃣ **Mapa de Órdenes y Cuadrillas**

**Componente:** `DashboardMap` (de `@/components/dashboard/DashboardMap`)

**Estructura Visual:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           🗺️ GOOGLE MAPS (La Rioja)                    │
│                                                         │
│    🏠     🏠      🏠                                    │
│  (Orden) (Orden) (Orden)                               │
│                                                         │
│         👥                                             │
│      (Cuadrilla)                                       │
│                                                         │
│                    🏠                                   │
│                 (Orden)                                │
│                                                         │
│  [Popup informativo al hacer clic en marcador]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Características:**

1. **Configuración del Mapa:**
   - **Altura:** 600px fija
   - **Centro:** La Rioja, Argentina (`lat: -29.4131, lng: -66.8558`)
   - **Zoom:** 13 (vista de ciudad)
   - **Tipo:** Google Maps con estilo personalizado (Map ID: `9c96b18e81ab19904121ac45`)

2. **Marcadores de Órdenes:**
   - **Tipo:** Iconos de casa (`icon: 'house'`)
   - **Color según estado:**
     - `PENDIENTE`: 🟡 `#EAB308` (Amarillo)
     - `ASIGNADA`: 🔵 `#3B82F6` (Azul)
     - `EN_PROGRESO`: 🟣 `#A855F7` (Púrpura)
     - `FINALIZADA`: 🟢 `#10B981` (Verde)
     - `CANCELADA`: 🔴 `#EF4444` (Rojo)
   - **Datos mostrados:**
     - Categoría de servicio
     - Dirección
     - Cliente (nombre completo o razón social)
     - Fecha de creación

3. **Marcadores de Cuadrillas:**
   - **Tipo:** Iconos de equipo (`icon: 'team'`)
   - **Color según disponibilidad:**
     - `AVAILABLE`: 🟢 `#10B981` (Verde)
     - `BUSY`: 🟠 `#F59E0B` (Ámbar)
     - `OFFLINE`: ⚪ `#6B7280` (Gris)
   - **Datos mostrados:**
     - Nombre de la cuadrilla
     - Estado de disponibilidad
     - Cantidad de miembros

4. **Interacciones:**
   - **Click en marcador:** Abre popup informativo
   - **Popup muestra:**
     - Título (categoría o nombre de cuadrilla)
     - Descripción (dirección o detalles)
     - Información adicional (cliente, fecha, etc.)
   - **Cerrar popup:** Botón X o click fuera

5. **Filtrado de Datos:**
   - Solo muestra órdenes con coordenadas válidas (`lat && lng`)
   - Solo muestra cuadrillas con coordenadas válidas
   - Si no hay datos, el mapa se muestra vacío pero funcional

6. **Componente Base:**
   - Usa `GoogleMap` de `@/components/map/google-map`
   - Recibe arrays de órdenes y cuadrillas como props
   - Convierte datos a formato `MapMarker` para el componente base

---

### 5️⃣ **Tabla de Últimas Órdenes**

**Estructura Visual:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Últimas Órdenes                          [Ver todas →]          │
├──────────────────────────────────────────────────────────────────┤
│ ID/Fecha  │ Servicio      │ Dirección       │ Operador │ Estado  │
├──────────────────────────────────────────────────────────────────┤
│ abc123... │ Electricidad  │ Av. Principal   │ Juan     │ [Badge] │
│ 12/01/24  │               │ 123             │          │         │
├──────────────────────────────────────────────────────────────────┤
│ def456... │ Plomería      │ Calle Secund.   │ María    │ [Badge] │
│ 13/01/24  │               │ 456             │          │         │
└──────────────────────────────────────────────────────────────────┘
```

**Características:**

1. **Header de la Sección:**
   - Título: "Últimas Órdenes"
   - Link: "Ver todas" → `/ordenes`
   - Estilo: Fondo blanco, bordes redondeados, sombra suave

2. **Tabla:**
   - **Columnas:**
     - **ID / Fecha:**
       - ID truncado a primeros caracteres
       - Fecha formateada (`toLocaleDateString()`)
       - Texto pequeño y gris para fecha

     - **Servicio:**
       - Categoría de servicio (`serviceCategory`)
       - Texto medio, peso medium

     - **Dirección:**
       - Dirección completa (`address`)
       - Texto pequeño, color gris

     - **Operador:**
       - Nombre del operador asignado
       - Muestra "-" si no hay operador

     - **Estado (Acción):**
       - Badge interactivo (ver sección siguiente)
       - Alineado al centro
       - Clickeable para cambiar estado

3. **Limitación:**
   - Muestra solo las **5 primeras órdenes** (`orders.slice(0, 5)`)
   - Ordenadas por fecha de creación (más recientes primero)

4. **Estados de Carga:**
   - **Loading:** Spinner centrado (48px de altura)
   - **Sin datos:** Tabla vacía con mensaje implícito
   - **Hover en fila:** Fondo gris claro (`hover:bg-gray-50`)

5. **Responsive:**
   - Scroll horizontal en móvil (`overflow-x-auto`)
   - Tabla completa en desktop

---

### 6️⃣ **Badges de Estado (Interactivos)**

**Componente:** `StatusBadge` (función interna en `dashboard/page.tsx`)

**Estructura Visual:**
```
┌────────────────────┐
│ 🔵 ASIGNADA        │  ← Badge clickeable
└────────────────────┘
```

**Características:**

1. **Diseño por Estado:**
   - **PENDIENTE:**
     - Fondo: `bg-yellow-100`
     - Texto: `text-yellow-800`
     - Borde: `border-yellow-200`

   - **ASIGNADA:**
     - Fondo: `bg-blue-100`
     - Texto: `text-blue-800`
     - Borde: `border-blue-200`

   - **EN_PROGRESO:**
     - Fondo: `bg-purple-100`
     - Texto: `text-purple-800`
     - Borde: `border-purple-200`

   - **FINALIZADA:**
     - Fondo: `bg-green-100`
     - Texto: `text-green-800`
     - Borde: `border-green-200`

   - **CANCELADA:**
     - Fondo: `bg-red-100`
     - Texto: `text-red-800`
     - Borde: `border-red-200`

2. **Elementos del Badge:**
   - **Punto indicador:** Círculo pequeño (1.5px) antes del texto
   - **Texto:** Estado en mayúsculas
   - **Hover:** Cambia color de fondo (más oscuro)
   - **Cursor:** Pointer (indica que es clickeable)
   - **Tooltip:** "Clic para cambiar estado"

3. **Interacción:**
   - Al hacer clic, abre el modal de cambio de estado
   - Pasa la orden seleccionada al modal

---

### 7️⃣ **Modal de Cambio de Estado**

**Componente:** `OrderStateModal` (de `@/components/operator/OrderStateModal`)

**Estructura Visual:**
```
┌──────────────────────────────────────┐
│  Actualizar Estado              [X]  │
│  Orden #abc123...                    │
├──────────────────────────────────────┤
│                                      │
│  Seleccione el nuevo estado:         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 🔵 Asignada            →     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ▶ En Progreso          →     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ✅ Finalizada           →     │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Características:**

1. **Flujo de Dos Pasos:**

   **Paso 1: Selección de Estado**
   - Muestra todos los estados disponibles (excepto el actual)
   - Cada opción es un botón con el color del estado
   - Flecha a la derecha indica que es clickeable
   - Al seleccionar, avanza al paso 2

   **Paso 2: Detalles del Cambio**
   - Muestra resumen del cambio ("Cambiando a: [ESTADO]")
   - Botón "Cambiar" para volver al paso 1
   - Campos dinámicos según el estado seleccionado:

     **Si es ASIGNADA:**
     - Selector de cuadrilla (requerido)
     - Carga cuadrillas desde `/crews`
     - Campo de observaciones (opcional)

     **Si es FINALIZADA:**
     - Campo "Motivo de finalización"
     - Campo "Observaciones"

     **Si es CANCELADA:**
     - Campo "Motivo de cancelación"
     - Campo "Observaciones"

     **Otros estados:**
     - Solo campo "Observaciones"

2. **Lógica de Backend:**

   **Para ASIGNADA:**
   ```typescript
   // 1. Asignar cuadrilla
   await opsApi.patch(`/work-orders/${order.id}/assign-crew/${selectedCrew}`, {
     observation
   });
   ```

   **Para otros estados:**
   ```typescript
   // 2. Actualizar estado
   await opsApi.patch(`/work-orders/${order.id}/state`, {
     state: targetState,
     note: observation || reason
   });
   ```

3. **UI/UX:**
   - Overlay oscuro con blur (`bg-black/30 backdrop-blur-sm`)
   - Modal centrado con sombra (`shadow-xl`)
   - Botón de cerrar en header
   - Mensajes de error en rojo si falla
   - Loading spinner durante la operación
   - Al completar: cierra modal y recarga datos

4. **Validaciones:**
   - Cuadrilla requerida para ASIGNADA
   - Observaciones opcionales en todos los casos
   - Manejo de errores del backend

---

## 🔄 Flujo de Datos

### Carga Inicial

```typescript
useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  // 1. Cargar órdenes
  const ordersResult = await opsApi.get('/work-orders');
  
  // 2. Cargar cuadrillas
  const crewsResult = await opsApi.get('/crews');
  
  // 3. Procesar datos:
  //    - Filtrar últimas 5 órdenes
  //    - Filtrar órdenes con coordenadas (para mapa)
  //    - Filtrar cuadrillas con coordenadas (para mapa)
  //    - Calcular estadísticas por estado
  //    - Actualizar estados del componente
};
```

### Endpoints Utilizados

1. **KPI Cards:**
   - `GET /ops/metrics/operator/summary`
   - Retorna: `{ reclamosTotales, incidentesHoy, visitasHoy, ordenesPorEstado }`

2. **Gráfico de Evolución:**
   - `GET /ops/metrics/operator/orders-by-status-series?groupBy={day|month|year}`
   - Retorna: `Array<{ periodo, pendiente, en_curso, finalizado, cancelado }>`

3. **Órdenes:**
   - `GET /ops/work-orders`
   - Retorna: `Array<WorkOrder>`

4. **Cuadrillas:**
   - `GET /ops/crews`
   - Retorna: `Array<Crew>`

5. **Cambio de Estado:**
   - `PATCH /ops/work-orders/:id/assign-crew/:crewId` (para ASIGNADA)
   - `PATCH /ops/work-orders/:id/state` (para otros estados)

---

## 🎨 Sistema de Diseño

### Colores Principales (Aaron Services)

- **Azul Primario:** `#294C75`
- **Naranja:** `#F9782E`
- **Verde:** `#22A06B`
- **Púrpura:** `#8F4CF9`
- **Rojo:** `#E24343`

### Tipografía

- **Títulos:** `text-2xl font-bold text-gray-900`
- **Subtítulos:** `text-sm text-gray-500`
- **Texto de cards:** `text-sm font-medium text-gray-700`
- **Valores numéricos:** `text-2xl font-bold text-gray-900`

### Espaciado

- **Secciones:** `space-y-8` (32px entre secciones)
- **Cards KPI:** `gap-6` (24px entre cards)
- **Grid de estados:** `gap-6` (24px)

### Bordes y Sombras

- **Cards:** `rounded-3xl` o `rounded-xl`
- **Sombra estándar:** `shadow-[0_20px_40px_rgba(38,57,77,0.08)]`
- **Sombra hover:** `shadow-[0_16px_32px_rgba(16,24,40,0.12)]`

---

## 📱 Responsive Design

### Breakpoints

- **Móvil (< 640px):**
  - KPI Cards: 1 columna
  - Grid de estados/gráfico: 1 columna (apilado)
  - Tabla: Scroll horizontal

- **Tablet (640px - 1280px):**
  - KPI Cards: 2 columnas
  - Grid de estados/gráfico: 1 columna (apilado)
  - Tabla: Completa

- **Desktop (> 1280px):**
  - KPI Cards: 4 columnas
  - Grid de estados/gráfico: 2 columnas (lado a lado)
  - Tabla: Completa

---

## 🔐 Permisos y Roles

La vista Home es accesible para:
- **ADMIN:** Acceso completo
- **OPERATOR:** Acceso completo
- **CUSTOMER:** No tiene acceso (redirigido)

El acceso se controla en el layout (`app/(app)/layout.tsx`) mediante el hook `useAuth()`.

---

## ⚡ Optimizaciones

1. **Carga Paralela:**
   - Órdenes y cuadrillas se cargan en paralelo con `Promise.all()`

2. **Lazy Loading:**
   - Los componentes de gráficos (Chart.js) se cargan solo cuando son necesarios

3. **Memoización:**
   - Los datos procesados podrían memoizarse (no implementado actualmente)

4. **Refresh Manual:**
   - Botón "Actualizar" permite recargar datos sin refrescar la página

---

## 🐛 Manejo de Errores

1. **Errores de Red:**
   - Se capturan en try-catch
   - Se muestran valores por defecto (0 o arrays vacíos)
   - No se muestra mensaje de error al usuario (solo en consola)

2. **Datos Faltantes:**
   - Coordenadas inválidas se filtran automáticamente
   - Valores null/undefined se manejan como 0 o "-"

3. **Estados de Carga:**
   - Skeletons durante la carga inicial
   - Spinners en operaciones asíncronas

---

## 🔄 Actualizaciones en Tiempo Real

Actualmente, la vista **NO** tiene actualizaciones en tiempo real automáticas. Los datos se cargan:
- Al montar el componente (useEffect)
- Al hacer clic en "Actualizar"
- Después de cambiar el estado de una orden (via modal)

**Posible mejora futura:** Integrar WebSockets o polling para actualizaciones automáticas.

---

## 📝 Resumen de Componentes Utilizados

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `KPIcards` | `components/operator/KPIcards.tsx` | Tarjetas de métricas principales |
| `OrdersStatusChart` | `components/operator/OrdersStatusChart.tsx` | Gráfico de evolución |
| `BudgetCard` | `components/ui/budget-card.tsx` | Cards de estados de órdenes |
| `DashboardMap` | `components/dashboard/DashboardMap.tsx` | Mapa interactivo |
| `OrderStateModal` | `components/operator/OrderStateModal.tsx` | Modal de cambio de estado |
| `GoogleMap` | `components/map/google-map.tsx` | Componente base del mapa |
| `Header` | `components/layout/header.tsx` | Barra superior (layout) |
| `Sidebar` | `components/layout/sidebar.tsx` | Navegación lateral (layout) |

---

## 🎯 Funcionalidades Principales

1. ✅ **Visualización de KPIs** en tiempo real
2. ✅ **Monitoreo de estados** de órdenes
3. ✅ **Análisis de tendencias** mediante gráficos
4. ✅ **Visualización geográfica** de órdenes y cuadrillas
5. ✅ **Gestión rápida** de estados de órdenes
6. ✅ **Acceso rápido** a órdenes filtradas por estado
7. ✅ **Vista resumida** de últimas órdenes

---

## 🚀 Mejoras Futuras Sugeridas

1. **Actualizaciones en tiempo real** (WebSockets)
2. **Filtros avanzados** (fecha, servicio, operador)
3. **Exportación de datos** (PDF, Excel)
4. **Notificaciones push** para eventos importantes
5. **Modo oscuro**
6. **Personalización de widgets** (drag & drop)
7. **Filtros guardados** (presets)

---

**Última actualización:** Enero 2025
**Versión del documento:** 1.0

