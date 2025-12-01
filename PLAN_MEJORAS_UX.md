# Plan de Mejoras UX y Robustez del Código

## Objetivo
Mejorar la experiencia de usuario, robustez y mantenibilidad del código mediante:
1. Tipos más estrictos para payloads del backend
2. Validación en frontend antes de enviar
3. Loading states más granulares
4. Error handling mejorado con mensajes específicos

---

## 1. Tipos Más Estrictos: Interfaces para Payloads del Backend

### 1.1 Crear archivo de tipos para payloads
**Archivo:** `frontend/web/lib/types/backend-payloads.ts`

```typescript
/**
 * Tipos estrictos para payloads que se envían al backend
 * Separados de los DTOs del frontend para mayor claridad
 */

// ============ CLIENTES ============
export interface CreateClientManualBackendPayload {
  email: string;
  password?: string;
  fullName: string;
  telefono?: string;
  documento?: string;
  address: string; // Backend espera 'address', no 'direccionFacturacion'
  lat: number;
  lng: number;
  tipoPropiedad?: string;
  tipoConstruccion?: string;
  ambientes?: number;
  banos?: number;
  superficieCubiertaM2?: number;
  superficieDescubiertaM2?: number;
  barrio?: string;
  ciudad?: string;
  provincia?: string;
  planId: string;
  observaciones?: string;
  observacionesPropiedad?: string;
}

// ============ WORK ORDERS ============
export interface CreateWorkOrderBackendPayload {
  customerId?: string;
  propertyId?: string; // Solo si está presente y no vacío
  workTypeId?: string; // Solo si está presente y no vacío
  serviceCategory: string;
  situacion: string;
  peligroAccidente?: string;
  observaciones?: string;
  description?: string;
  prioridad?: string;
  canal?: string;
  cantidadEstimada?: number;
  unidadCantidad?: string; // Solo si está presente y no vacío
}

// ============ RESPUESTAS DEL BACKEND ============
export interface BackendErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: {
    message: string | string[];
    error: string;
    statusCode: number;
  };
}
```

### 1.2 Actualizar funciones API para usar tipos estrictos
**Archivos a modificar:**
- `frontend/web/lib/clients/api.ts`
- `frontend/web/lib/work-orders/api.ts`

**Cambios:**
- Usar `CreateClientManualBackendPayload` en lugar de `any`
- Usar `CreateWorkOrderBackendPayload` en lugar de `Partial<CreateWorkOrderRequestDto>`
- Tipar respuestas de error con `BackendErrorResponse`

---

## 2. Validación en Frontend

### 2.1 Crear utilidades de validación
**Archivo:** `frontend/web/lib/utils/validation.ts`

```typescript
/**
 * Utilidades de validación para formularios
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Validación de email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validación de coordenadas
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Validación de DNI/CUIT
export function validateDocument(documento: string): boolean {
  // DNI: 7-8 dígitos, CUIT: 11 dígitos con guiones
  const dniRegex = /^\d{7,8}$/;
  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  return dniRegex.test(documento) || cuitRegex.test(documento);
}

// Validación de teléfono
export function validatePhone(telefono: string): boolean {
  // Acepta números con o sin guiones, espacios, paréntesis
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  return phoneRegex.test(telefono) && telefono.replace(/\D/g, '').length >= 8;
}

// Validación de contraseña
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// Validación completa de cliente manual
export function validateManualClient(data: {
  email: string;
  password?: string;
  fullName: string;
  telefono?: string;
  documento?: string;
  direccionFacturacion: string;
  lat: number;
  lng: number;
  planId: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 3) {
    errors.fullName = 'El nombre debe tener al menos 3 caracteres';
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Email inválido';
  }

  if (data.password && !validatePassword(data.password)) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  if (data.telefono && !validatePhone(data.telefono)) {
    errors.telefono = 'Teléfono inválido';
  }

  if (data.documento && !validateDocument(data.documento)) {
    errors.documento = 'DNI o CUIT inválido';
  }

  if (!data.direccionFacturacion || data.direccionFacturacion.trim().length < 5) {
    errors.direccionFacturacion = 'La dirección debe tener al menos 5 caracteres';
  }

  if (!validateCoordinates(data.lat, data.lng)) {
    errors.coordinates = 'Coordenadas inválidas';
  }

  if (!data.planId) {
    errors.planId = 'Debe seleccionar un plan';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Validación de work order
export function validateWorkOrder(data: {
  customerId: string;
  serviceCategory: string;
  situacion: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.customerId) {
    errors.customerId = 'Debe seleccionar un cliente';
  }

  if (!data.serviceCategory) {
    errors.serviceCategory = 'Debe seleccionar una categoría';
  }

  if (!data.situacion || data.situacion.trim().length < 10) {
    errors.situacion = 'La descripción del problema debe tener al menos 10 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### 2.2 Integrar validación en componentes
**Archivos a modificar:**
- `frontend/web/components/solicitudes/CreateManualClientModal.tsx`
- `frontend/web/components/operator/CreateWorkOrderModal.tsx`

**Cambios:**
- Agregar estado para errores de validación
- Validar antes de enviar
- Mostrar errores específicos por campo
- Deshabilitar botón de envío si hay errores

---

## 3. Loading States Más Granulares

### 3.1 Crear componente de loading reutilizable
**Archivo:** `frontend/web/components/ui/LoadingSpinner.tsx`

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
  // Implementación con diferentes tamaños y opciones
}
```

### 3.2 Agregar estados de loading específicos
**Archivos a modificar:**
- `frontend/web/components/solicitudes/CreateManualClientModal.tsx`
- `frontend/web/components/operator/CreateWorkOrderModal.tsx`

**Estados a agregar:**
```typescript
const [loadingStates, setLoadingStates] = useState({
  loadingPlans: false,
  loadingClients: false,
  loadingProperties: false,
  submitting: false,
});
```

**Uso:**
- Mostrar spinner mientras carga planes
- Mostrar spinner mientras carga clientes
- Mostrar spinner mientras carga propiedades
- Mostrar spinner mientras se envía el formulario
- Deshabilitar campos relevantes durante carga

---

## 4. Error Handling Mejorado

### 4.1 Crear utilidad para parsear errores del backend
**Archivo:** `frontend/web/lib/utils/error-handler.ts`

```typescript
import { BackendErrorResponse } from '../types/backend-payloads';

/**
 * Parsea errores del backend y retorna mensajes amigables
 */
export function parseBackendError(error: unknown): string {
  // Si es un error de red
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Error de conexión. Verifique su internet e intente nuevamente.';
  }

  // Si es un error del backend con estructura conocida
  if (typeof error === 'object' && error !== null) {
    const backendError = error as BackendErrorResponse;
    
    if (backendError.message) {
      const message = backendError.message.message;
      
      // Si es un array de mensajes
      if (Array.isArray(message)) {
        return message.join('. ');
      }
      
      // Si es un string
      if (typeof message === 'string') {
        return message;
      }
    }
  }

  // Si es un Error estándar
  if (error instanceof Error) {
    return error.message;
  }

  // Error genérico
  return 'Ocurrió un error inesperado. Por favor, intente nuevamente.';
}

/**
 * Extrae errores de validación por campo
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (typeof error === 'object' && error !== null) {
    const backendError = error as BackendErrorResponse;
    
    if (backendError.message && Array.isArray(backendError.message.message)) {
      backendError.message.message.forEach((msg: string) => {
        // Buscar patrones como "email must be an email" o "address must be a string"
        const match = msg.match(/(\w+)\s+(.+)/);
        if (match) {
          const field = match[1];
          const message = match[2];
          fieldErrors[field] = message;
        }
      });
    }
  }

  return fieldErrors;
}
```

### 4.2 Crear componente de alerta de error
**Archivo:** `frontend/web/components/ui/ErrorAlert.tsx`

```typescript
interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  title?: string;
}

export function ErrorAlert({ error, onDismiss, title = 'Error' }: ErrorAlertProps) {
  // Componente de alerta con diseño consistente
}
```

### 4.3 Integrar en componentes
**Archivos a modificar:**
- `frontend/web/components/solicitudes/CreateManualClientModal.tsx`
- `frontend/web/components/operator/CreateWorkOrderModal.tsx`

**Cambios:**
- Usar `parseBackendError` para mostrar mensajes amigables
- Usar `extractFieldErrors` para mostrar errores por campo
- Mostrar `ErrorAlert` cuando hay errores
- Mantener errores visibles hasta que el usuario los cierre o corrija

---

## Orden de Implementación

### Fase 1: Tipos Estrictos (Prioridad Alta)
1. ✅ Crear `frontend/web/lib/types/backend-payloads.ts`
2. ✅ Actualizar `frontend/web/lib/clients/api.ts`
3. ✅ Actualizar `frontend/web/lib/work-orders/api.ts`

### Fase 2: Validación Frontend (Prioridad Alta)
1. ✅ Crear `frontend/web/lib/utils/validation.ts`
2. ✅ Integrar validación en `CreateManualClientModal.tsx`
3. ✅ Integrar validación en `CreateWorkOrderModal.tsx`

### Fase 3: Error Handling (Prioridad Media)
1. ✅ Crear `frontend/web/lib/utils/error-handler.ts`
2. ✅ Crear `frontend/web/components/ui/ErrorAlert.tsx`
3. ✅ Integrar en modales

### Fase 4: Loading States (Prioridad Media)
1. ✅ Crear `frontend/web/components/ui/LoadingSpinner.tsx`
2. ✅ Agregar estados de loading en modales
3. ✅ Mejorar feedback visual durante carga

---

## Archivos a Crear

1. `frontend/web/lib/types/backend-payloads.ts` - Tipos estrictos
2. `frontend/web/lib/utils/validation.ts` - Utilidades de validación
3. `frontend/web/lib/utils/error-handler.ts` - Manejo de errores
4. `frontend/web/components/ui/LoadingSpinner.tsx` - Componente de loading
5. `frontend/web/components/ui/ErrorAlert.tsx` - Componente de error

## Archivos a Modificar

1. `frontend/web/lib/clients/api.ts` - Usar tipos estrictos y mejor error handling
2. `frontend/web/lib/work-orders/api.ts` - Usar tipos estrictos y mejor error handling
3. `frontend/web/components/solicitudes/CreateManualClientModal.tsx` - Validación, loading, errores
4. `frontend/web/components/operator/CreateWorkOrderModal.tsx` - Validación, loading, errores

---

## Criterios de Éxito

- ✅ Todos los payloads tienen tipos estrictos (no `any`)
- ✅ Validación en frontend previene envíos inválidos
- ✅ Mensajes de error claros y específicos
- ✅ Loading states visibles en todas las operaciones asíncronas
- ✅ Errores del backend se muestran de forma amigable
- ✅ Código más mantenible y fácil de debuggear

---

## Notas

- Mantener retrocompatibilidad durante la implementación
- Probar cada fase antes de continuar
- Documentar cambios en comentarios del código
- Considerar internacionalización (i18n) para mensajes de error en el futuro

