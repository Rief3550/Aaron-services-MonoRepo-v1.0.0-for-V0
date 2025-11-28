# CRUD Structure - Users Example

Esta carpeta contiene la implementación completa del CRUD de Usuarios siguiendo **Clean Architecture** y **SOLID principles**. Esta estructura es **replicable** para otros CRUDs (Cuadrillas, Suscripciones, Clientes, Inmuebles, Órdenes, etc.).

## 📁 Estructura de Archivos

```
lib/users/
├── types.ts          # Domain layer - Tipos TypeScript del dominio
├── api.ts            # Infrastructure layer - Servicios de API
└── README.md         # Esta documentación

components/users/
├── user-list.tsx     # Presentation layer - Lista usando DataTable
└── user-form.tsx     # Presentation layer - Formulario de creación/edición

app/(app)/admin/usuarios/
└── page.tsx          # Presentation layer - Página principal
```

## 🔄 Cómo Replicar para Otros CRUDs

### Paso 1: Crear tipos del dominio (`lib/{domain}/types.ts`)

```typescript
/**
 * {Domain} Types
 * Domain layer - Tipos del dominio de {domain}
 */

export interface {Entity} {
  id: string;
  // Campos específicos del dominio
  name: string;
  // ... otros campos
}

export interface {Entity}FormData {
  // Campos del formulario
  name: string;
  // ... otros campos
}
```

### Paso 2: Crear servicio de API (`lib/{domain}/api.ts`)

```typescript
/**
 * {Domain} API Service
 * Infrastructure layer - Servicio de API para gestión de {domain}
 */

import type { {Entity} } from './types';

// Helper para requests al gateway
async function gatewayRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_{SERVICE}_URL || 'http://localhost:3000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.message || 'Error en la petición');
  }

  const result = await response.json();
  return result.data || result;
}

// CRUD operations
export async function fetch{Entities}(): Promise<{Entity}[]> {
  const items = await gatewayRequest<{Entity}[]>('/{domain}');
  return Array.isArray(items) ? items : [items];
}

export async function fetch{Entity}ById(id: string): Promise<{Entity}> {
  return gatewayRequest<{Entity}>(`/{domain}/${id}`);
}

export async function create{Entity}(data: Create{Entity}Dto): Promise<{Entity}> {
  return gatewayRequest<{Entity}>('/{domain}', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function update{Entity}(id: string, data: Update{Entity}Dto): Promise<{Entity}> {
  return gatewayRequest<{Entity}>(`/{domain}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function delete{Entity}(id: string): Promise<void> {
  await gatewayRequest(`/{domain}/${id}`, {
    method: 'DELETE',
  });
}
```

### Paso 3: Crear componente de Lista (`components/{domain}/{domain}-list.tsx`)

```typescript
/**
 * {Entity} List Component
 * Presentation layer - Lista usando DataTable reutilizable
 */

'use client';

import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { fetch{Entities}, delete{Entity}, type {Entity} } from '@/lib/{domain}/api';

export function {Entity}List({ onEdit, onRefresh }: {Entity}ListProps) {
  // Estado y carga de datos
  // ...

  // Configuración de columnas
  const columns: TableColumn<{Entity}>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      // render personalizado si es necesario
    },
    // ... más columnas
  ];

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <DataTable
        data={items}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay elementos registrados"
      />
    </div>
  );
}
```

### Paso 4: Crear componente de Formulario (`components/{domain}/{domain}-form.tsx`)

```typescript
/**
 * {Entity} Form Component
 * Presentation layer - Formulario de creación/edición
 */

'use client';

export function {Entity}Form({ entity, onSuccess, onCancel }: {Entity}FormProps) {
  // Estado del formulario
  // Validación
  // Submit handler
  // ...

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      {/* Botones */}
    </form>
  );
}
```

### Paso 5: Crear página principal (`app/(app)/admin/{domain}/page.tsx`)

```typescript
/**
 * {Entity} Management Page
 * Presentation layer - Página principal
 */

'use client';

export default function {Entities}Page() {
  // Estado para mostrar formulario/lista
  // Handlers
  // ...

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Contenido: Form o List */}
    </div>
  );
}
```

## 🎯 Principios Aplicados

### Clean Architecture

- **Domain Layer** (`types.ts`): Tipos puros, sin dependencias externas
- **Infrastructure Layer** (`api.ts`): Comunicación con el backend
- **Presentation Layer** (`components/`, `app/`): UI y lógica de presentación

### SOLID Principles

1. **Single Responsibility**: Cada componente tiene una única responsabilidad
2. **Open/Closed**: Fácil extender sin modificar código existente
3. **Liskov Substitution**: Interfaces consistentes entre CRUDs
4. **Interface Segregation**: Tipos específicos por dominio
5. **Dependency Inversion**: Dependemos de abstracciones (tipos), no implementaciones

## 📝 Particularidades por CRUD

Cada CRUD tiene sus propias particularidades:

### Usuarios
- ✅ Validación de contraseñas
- ✅ Gestión de roles
- ✅ Verificación de email

### Inmuebles
- ✅ UUID
- ✅ Campos: ambientes, dirección, tipo de construcción, materiales
- ✅ Coordenadas (lat/lng) para mapas
- ✅ Relación con cliente

### Clientes
- ✅ Username, nombre, teléfono, email
- ✅ Relación con inmuebles (1:N)
- ✅ Coordenadas del inmueble principal

### Suscripciones
- ✅ Un cliente puede tener múltiples suscripciones
- ✅ Domicilios múltiples
- ✅ Estados de suscripción

### Órdenes/Trabajos
- ✅ Estados de orden
- ✅ Relación con cuadrilla
- ✅ Historial de cambios

## 🔧 Ejemplo de Replicación: Inmuebles

```typescript
// lib/properties/types.ts
export interface Property {
  id: string;
  uuid: string;
  address: string;
  lat: number;
  lng: number;
  clientId: string;
  constructionType: string;
  materials: string[];
  rooms: Room[];
  // ... más campos específicos
}

// lib/properties/api.ts
export async function fetchProperties(): Promise<Property[]> {
  return gatewayRequest<Property[]>('/properties');
}
// ... resto de operaciones CRUD

// components/properties/property-list.tsx
// components/properties/property-form.tsx
// app/(app)/admin/properties/page.tsx
```

## ✅ Checklist para Nuevo CRUD

- [ ] Crear `lib/{domain}/types.ts` con tipos del dominio
- [ ] Crear `lib/{domain}/api.ts` con servicios de API
- [ ] Crear `components/{domain}/{domain}-list.tsx` usando DataTable
- [ ] Crear `components/{domain}/{domain}-form.tsx` con validaciones
- [ ] Crear `app/(app)/admin/{domain}/page.tsx` integrando todo
- [ ] Agregar ruta al sidebar si es necesario
- [ ] Probar todas las operaciones CRUD
- [ ] Validar permisos y roles

## 📚 Recursos Compartidos

Componentes UI reutilizables ya creados:
- `DataTable` - Tabla con ordenamiento y paginación
- `StatusBadge` - Badges de estado
- `Button` - Botón reutilizable
- `Pagination` - Paginación
- `Loader` - Indicadores de carga
- `BudgetCard` / `BudgetCardGrid` - Cards de estadísticas

## 🚀 Ventajas de esta Estructura

1. **Consistencia**: Todos los CRUDs siguen el mismo patrón
2. **Mantenibilidad**: Fácil de entender y modificar
3. **Escalabilidad**: Fácil agregar nuevos CRUDs
4. **Testeable**: Cada capa se puede testear independientemente
5. **Reutilizable**: Componentes UI compartidos

