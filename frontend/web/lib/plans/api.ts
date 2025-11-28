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
export async function fetchPlans(activeOnly: boolean = true): Promise<Plan[]> {
  const query = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
  const result = await opsApi.get<Plan[]>(`/plans${query}`);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar planes');
  }
  
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Obtener plan por ID
 */
export async function fetchPlanById(id: string): Promise<Plan> {
  const result = await opsApi.get<Plan>(`/plans/${id}`);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar plan');
  }
  return result.data;
}

/**
 * Crear nuevo plan
 */
export async function createPlan(data: CreatePlanDto): Promise<Plan> {
  const result = await opsApi.post<Plan>('/plans', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear plan');
  }
  return result.data;
}

/**
 * Actualizar plan
 */
export async function updatePlan(id: string, data: UpdatePlanDto): Promise<Plan> {
  const result = await opsApi.patch<Plan>(`/plans/${id}`, data);
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

