# 📋 Estructura CRUD - Guía Completa

Esta guía documenta la estructura reutilizable de CRUDs implementada en el proyecto, siguiendo **Clean Architecture** y **SOLID Principles**.

## ✅ CRUDs Implementados

### 1. Usuarios (`/admin/usuarios`)
- ✅ Completado
- Ubicación: `lib/users/`, `components/users/`, `app/(app)/admin/usuarios/`
- Características: Gestión de contraseñas, roles, validaciones complejas

### 2. Cuadrillas (`/admin/cuadrillas`)
- ✅ Completado (Ejemplo de replicación)
- Ubicación: `lib/crews/`, `components/crews/`, `app/(app)/admin/cuadrillas/`
- Características: Estados, progreso, miembros

## 🏗️ Estructura Base

Cada CRUD sigue esta estructura:

```
lib/{domain}/
├── types.ts          # Domain layer - Tipos TypeScript
├── api.ts            # Infrastructure layer - Servicios API
└── README.md         # Documentación específica

components/{domain}/
├── {domain}-list.tsx    # Presentation - Lista con DataTable
└── {domain}-form.tsx    # Presentation - Formulario

app/(app)/admin/{domain}/
└── page.tsx          # Presentation - Página principal
```

## 📝 Pasos para Replicar

### Paso 1: Crear Tipos (`lib/{domain}/types.ts`)

```typescript
export interface {Entity} {
  id: string;
  // Campos específicos del dominio
}

export interface {Entity}FormData {
  // Campos del formulario
}
```

### Paso 2: Crear API Service (`lib/{domain}/api.ts`)

```typescript
import { opsApi } from '../api/services'; // o authApi, trackingApi según corresponda

export async function fetch{Entities}(): Promise<{Entity}[]> {
  const result = await opsApi.get<{Entity}[]>('/{domain}');
  // ...
}
```

### Paso 3: Crear Lista (`components/{domain}/{domain}-list.tsx`)

Usar `DataTable` con columnas configurables:

```typescript
import { DataTable } from '@/components/ui/data-table';

const columns: TableColumn<{Entity}>[] = [
  // Configurar columnas
];

<DataTable data={items} columns={columns} />
```

### Paso 4: Crear Formulario (`components/{domain}/{domain}-form.tsx`)

Formulario con validaciones específicas del dominio.

### Paso 5: Crear Página (`app/(app)/admin/{domain}/page.tsx`)

Página que integra Lista y Formulario con navegación.

## 🎯 Próximos CRUDs a Implementar

### 3. Suscripciones (`/admin/suscripciones`)
- [ ] Crear tipos
- [ ] Crear API service
- [ ] Crear lista y formulario
- [ ] Crear página
- **Particularidades**: Estados múltiples, relaciones con clientes e inmuebles

### 4. Clientes (`/admin/clientes`)
- [ ] Crear tipos
- [ ] Crear API service
- [ ] Crear lista y formulario
- [ ] Crear página
- **Particularidades**: Coordenadas, relación con inmuebles

### 5. Inmuebles/Propiedades (`/admin/propiedades`)
- [ ] Crear tipos
- [ ] Crear API service
- [ ] Crear lista y formulario
- [ ] Crear página
- **Particularidades**: UUID, coordenadas, checklist, ambientes, tipos

### 6. Planes (`/admin/planes`)
- [ ] Crear tipos
- [ ] Crear API service
- [ ] Crear lista y formulario
- [ ] Crear página
- **Particularidades**: Precios, períodos de facturación

### 7. Tipos de Trabajo (`/admin/tipos-trabajo`)
- [ ] Crear tipos
- [ ] Crear API service
- [ ] Crear lista y formulario
- [ ] Crear página
- **Particularidades**: Categorías, tiempos estimados

## 🔧 Componentes UI Reutilizables

Todos los CRUDs pueden usar:

- ✅ `DataTable` - Tabla con ordenamiento y paginación
- ✅ `StatusBadge` - Badges de estado
- ✅ `Button` - Botón reutilizable
- ✅ `Pagination` - Paginación
- ✅ `Loader` - Indicadores de carga
- ✅ `BudgetCard` / `BudgetCardGrid` - Cards de estadísticas

## 📚 Recursos

- **Ejemplo base**: `lib/users/` - CRUD completo con validaciones
- **Ejemplo replicado**: `lib/crews/` - CRUD simplificado
- **Documentación detallada**: Ver `lib/users/README.md`

## ✅ Checklist de Implementación

Para cada nuevo CRUD:

- [ ] Crear `lib/{domain}/types.ts`
- [ ] Crear `lib/{domain}/api.ts`
- [ ] Crear `components/{domain}/{domain}-list.tsx`
- [ ] Crear `components/{domain}/{domain}-form.tsx`
- [ ] Crear `app/(app)/admin/{domain}/page.tsx`
- [ ] Agregar ruta al sidebar si es necesario
- [ ] Probar todas las operaciones CRUD
- [ ] Validar permisos y roles
- [ ] Documentar particularidades en README

## 🚀 Ventajas de esta Estructura

1. **Consistencia**: Todos los CRUDs siguen el mismo patrón
2. **Mantenibilidad**: Fácil de entender y modificar
3. **Escalabilidad**: Fácil agregar nuevos CRUDs
4. **Testeable**: Cada capa se puede testear independientemente
5. **Reutilizable**: Componentes UI compartidos

