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
 */
export async function createWorkOrder(data: CreateWorkOrderRequestDto): Promise<WorkOrder> {
  const result = await opsApi.post<WorkOrder>('/work-orders/request', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear orden de trabajo');
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

