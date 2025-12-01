/**
 * Plans API Service
 * Infrastructure layer - Servicio de API para gestión de planes
 * Estructura replicable desde usuarios
 */

import { opsApi } from '../api/services';
import type { Plan } from './types';
export type { Plan };

export interface CreatePlanDto {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingPeriod?: string;
  active?: boolean;
  restrictions?: Record<string, unknown>;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingPeriod?: string;
  active?: boolean;
  restrictions?: Record<string, unknown>;
}

/**
 * Obtener lista de planes
 */
type FetchPlansOptions = {
  activeOnly?: boolean;
  admin?: boolean;
};

export async function fetchPlans(options?: FetchPlansOptions): Promise<Plan[]> {
  const activeOnly = options?.activeOnly ?? true;
  const admin = options?.admin ?? false;

  const params = new URLSearchParams();
  if (admin) {
    if (options?.activeOnly !== undefined) {
      params.append('activeOnly', activeOnly ? 'true' : 'false');
    }
  } else {
    params.append('activeOnly', activeOnly ? 'true' : 'false');
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const endpoint = admin ? `/admin/plans${query}` : `/plans${query}`;
  const result = await opsApi.get<Plan[]>(endpoint);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar planes');
  }
  
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Obtener plan por ID
 */
export async function fetchPlanById(id: string, options?: { admin?: boolean }): Promise<Plan> {
  const admin = options?.admin ?? false;
  const endpoint = admin ? `/admin/plans/${id}` : `/plans/${id}`;
  const result = await opsApi.get<Plan>(endpoint);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar plan');
  }
  return result.data;
}

/**
 * Crear nuevo plan
 */
export async function createPlan(data: CreatePlanDto): Promise<Plan> {
  const result = await opsApi.post<Plan>('/admin/plans', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear plan');
  }
  return result.data;
}

/**
 * Actualizar plan
 */
export async function updatePlan(id: string, data: UpdatePlanDto): Promise<Plan> {
  const result = await opsApi.patch<Plan>(`/admin/plans/${id}`, data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al actualizar plan');
  }
  return result.data;
}

/**
 * Obtener historial de precios de un plan
 */
export async function fetchPlanPriceHistory(id: string): Promise<unknown[]> {
  const result = await opsApi.get<unknown[]>(`/plans/${id}/price-history`);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar historial de precios');
  }
  return Array.isArray(result.data) ? result.data : [result.data];
}
