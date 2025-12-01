/**
 * Subscriptions API Service
 * Infrastructure layer - Servicio de API para gestión de suscripciones
 * Estructura replicable desde usuarios
 */

import { opsApi } from '../api/services';
import type { Subscription, SubscriptionStatus } from './types';
export type { Subscription, SubscriptionStatus };

export interface CreateSubscriptionDto {
  userId: string;
  planId: string;
  propertyId?: string;
  billingDay?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface UpdateSubscriptionStatusDto {
  status: SubscriptionStatus;
  reason?: string;
}

/**
 * Obtener lista de suscripciones con filtros opcionales
 */
export async function fetchSubscriptions(
  filters?: {
    userId?: string;
    status?: string;
  },
  options?: { admin?: boolean },
): Promise<Subscription[]> {
  const admin = options?.admin ?? false;
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.status) params.append('status', filters.status);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const endpoint = admin ? `/admin/subscriptions${query}` : `/subscriptions${query}`;
  const result = await opsApi.get<Subscription[]>(endpoint);
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar suscripciones');
  }
  
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Obtener suscripción por ID
 */
export async function fetchSubscriptionById(id: string): Promise<Subscription> {
  // Nota: Verificar si existe endpoint GET /subscriptions/:id en backend
  // Por ahora usamos list y filtramos
  const subscriptions = await fetchSubscriptions(undefined, { admin: true });
  const subscription = subscriptions.find((s) => s.id === id);
  if (!subscription) {
    throw new Error('Suscripción no encontrada');
  }
  return subscription;
}

/**
 * Crear nueva suscripción
 */
export async function createSubscription(data: CreateSubscriptionDto): Promise<Subscription> {
  const result = await opsApi.post<Subscription>('/admin/subscriptions', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear suscripción');
  }
  return result.data;
}

/**
 * Actualizar estado de suscripción
 */
export async function updateSubscriptionStatus(
  id: string,
  data: UpdateSubscriptionStatusDto
): Promise<Subscription> {
  const result = await opsApi.patch<Subscription>(`/admin/subscriptions/${id}/estado`, data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al actualizar estado de suscripción');
  }
  return result.data;
}

/**
 * Cambiar estado de suscripción (para operadores)
 */
export async function changeSubscriptionState(
  id: string,
  estado: string,
  observacion?: string
): Promise<Subscription> {
  return updateSubscriptionStatus(id, { status: estado as SubscriptionStatus, reason: observacion });
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(id: string): Promise<Subscription> {
  return updateSubscriptionStatus(id, { status: 'CANCELED' });
}

/**
 * Upgrade de plan
 */
export async function upgradeSubscription(id: string, planId: string): Promise<Subscription> {
  const result = await opsApi.patch<Subscription>(`/subscriptions/${id}/upgrade`, { planId });
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al hacer upgrade de suscripción');
  }
  return result.data;
}
