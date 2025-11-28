# Componentes UI Reutilizables

Componentes de interfaz adaptados desde diseños de referencia, optimizados para Aaron Backoffice.

## BudgetCard

Componente para mostrar estados con contadores. Adaptado desde StatusBadge de referencia, pero con estructura de tarjetas y colores de Aaron.

### Uso Básico

```tsx
import { BudgetCard } from '@/components/ui/budget-card';

// Ejemplo para órdenes
<BudgetCard
  state="PENDIENTE"
  count={15}
  context="orders"
  onClick={() => filterByState('PENDIENTE')}
/>

// Ejemplo para suscripciones
<BudgetCard
  state="ACTIVE"
  count={42}
  context="subscriptions"
/>
```

### BudgetCardGrid

Para mostrar múltiples budgets en grid:

```tsx
import { BudgetCardGrid } from '@/components/ui/budget-card';

const budgets = [
  { state: 'PENDIENTE' as const, count: 10 },
  { state: 'ASIGNADA' as const, count: 5 },
  { state: 'EN_PROGRESO' as const, count: 8 },
  { state: 'FINALIZADA' as const, count: 120 },
  { state: 'CANCELADA' as const, count: 3 },
];

<BudgetCardGrid budgets={budgets} context="orders" />
```

### Estados Soportados

**Órdenes:**
- `PENDIENTE` - Amarillo
- `ASIGNADA` - Azul
- `EN_PROGRESO` - Púrpura
- `FINALIZADA` - Verde esmeralda
- `CANCELADA` - Rojo

**Suscripciones:**
- `ACTIVE` - Verde esmeralda
- `PAST_DUE` - Naranja
- `SUSPENDED` - Ámbar
- `CANCELLED` - Gris

**Usuarios:**
- `ACTIVE` - Verde esmeralda
- `INACTIVE` - Gris
- `BAJA` - Rojo

---

## Pagination

Componente reutilizable de paginación. Extraído y optimizado desde OrdersTable.

### Uso Básico

```tsx
import { Pagination, usePagination } from '@/components/ui/pagination';

// Opción 1: Con hook
const { paginatedItems, currentPage, totalPages, setCurrentPage } = usePagination(allItems, 10);

<Pagination
  totalItems={allItems.length}
  itemsPerPage={10}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>

// Opción 2: Manual
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const totalItems = items.length;

<Pagination
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

### Ejemplo Completo con Tabla

```tsx
'use client';

import { useState } from 'react';
import { Pagination, usePagination } from '@/components/ui/pagination';

export function MyTable({ items }) {
  const { paginatedItems, currentPage, setCurrentPage, totalPages } = usePagination(items, 10);

  return (
    <div>
      <table>
        {/* Tabla */}
      </table>
      
      <Pagination
        totalItems={items.length}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
```

### Props

- `totalItems`: Número total de items
- `itemsPerPage`: Items por página (default: 10)
- `currentPage`: Página actual (1-indexed)
- `onPageChange`: Callback cuando cambia la página
- `className`: Clase CSS adicional
- `labelText`: Texto personalizado para el label

---

## Loader

Componente de carga con logo animado. Ver `loader.tsx` para más detalles.

---

## Notas de Diseño

- **Colores**: Adaptados a la paleta de Aaron
- **Sombras**: Mantenidas desde diseño de referencia
- **Tipografía**: Consistente con el sistema de diseño
- **Accesibilidad**: ARIA labels y keyboard navigation incluidos
- **Responsive**: Diseño adaptativo para móvil/tablet/desktop

