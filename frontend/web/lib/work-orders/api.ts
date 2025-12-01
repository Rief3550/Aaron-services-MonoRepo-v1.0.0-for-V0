/**
 * Work Orders API Service
 * Infrastructure layer - Servicio de API para órdenes de trabajo
 */

import { opsApi } from '../api/services';

export interface WorkOrder {
  id: string;
  customerId: string;
  clientId?: string;
  propertyId?: string;
  subscriptionId?: string;
  workTypeId?: string;
  address: string;
  lat?: number;
  lng?: number;
  serviceCategory: string;
  description?: string;
  prioridad?: string;
  state: string;
  createdAt: string;
  [key: string]: any;
}

export interface CreateWorkOrderRequestDto {
  customerId?: string; // Para ADMIN/OPERATOR: ID del cliente
  propertyId?: string;
  workTypeId?: string;
  serviceCategory: string;
  situacion: string;
  peligroAccidente?: string;
  observaciones?: string;
  description?: string;
  prioridad?: string; // BAJA|MEDIA|ALTA|EMERGENCIA (solo ADMIN/OPERATOR)
  canal?: string; // APP|WEB|TELEFONO|WHATSAPP
  cantidadEstimada?: number;
  unidadCantidad?: string;
}

/**
 * Crear una nueva orden de trabajo
 * Para ADMIN/OPERATOR: puede especificar customerId en el body
 * Limpia campos opcionales vacíos antes de enviar (el backend rechaza strings vacíos)
 */
export async function createWorkOrder(data: CreateWorkOrderRequestDto): Promise<WorkOrder> {
  // Limpiar campos opcionales: no enviar si están vacíos (el backend rechaza strings vacíos como UUID inválido)
  const payload: Partial<CreateWorkOrderRequestDto> = { ...data };
  
  // Remover campos opcionales vacíos
  if (!payload.propertyId || payload.propertyId.trim() === '') {
    delete payload.propertyId;
  }
  if (!payload.workTypeId || payload.workTypeId.trim() === '') {
    delete payload.workTypeId;
  }
  if (!payload.unidadCantidad || payload.unidadCantidad.trim() === '') {
    delete payload.unidadCantidad;
  }
  
  const result = await opsApi.post<WorkOrder>('/work-orders/request', payload);
  if (!result.success || !result.data) {
    // Extraer mensaje de error específico del backend
    let errorMessage = 'Error al crear orden de trabajo';
    if (result.error) {
      if (typeof result.error === 'object' && result.error !== null) {
        const errObj = result.error as any;
        if (errObj.message) {
          errorMessage = Array.isArray(errObj.message) 
            ? errObj.message.join(', ') 
            : String(errObj.message);
        }
      } else {
        errorMessage = String(result.error);
      }
    }
    console.error('[createWorkOrder] Error:', errorMessage, payload);
    throw new Error(errorMessage);
  }
  return result.data;
}

/**
 * Obtener lista de órdenes de trabajo
 */
export async function fetchWorkOrders(filters?: {
  state?: string;
  prioridad?: string;
  workTypeId?: string;
  crewId?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<WorkOrder[]> {
  const params = new URLSearchParams();
  if (filters?.state) params.append('state', filters.state);
  if (filters?.prioridad) params.append('prioridad', filters.prioridad);
  if (filters?.workTypeId) params.append('workTypeId', filters.workTypeId);
  if (filters?.crewId) params.append('crewId', filters.crewId);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.search) params.append('search', filters.search);

  const endpoint = params.toString() ? `/work-orders?${params.toString()}` : '/work-orders';
  const result = await opsApi.get<WorkOrder[]>(endpoint);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar órdenes de trabajo');
  }
  
  return Array.isArray(result.data) ? result.data : [result.data];
}


