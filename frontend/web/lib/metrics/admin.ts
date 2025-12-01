/**
 * Admin metrics API helpers
 * Infrastructure layer - metrics endpoints exposed by operations-service (/metrics/admin/*)
 */

import { opsApi } from '../api/services';

export interface AdminSummary {
  suscriptores_totales: number;
  altas_periodo: number;
  bajas_periodo: number;
  tasa_churn: number;
  ingresos_suscripciones_activas: number;
  monto_vencido: number;
  monto_por_vencer_30d?: number;
  porcentaje_perdidas_morosidad?: number;
}

export interface PlanBreakdown {
  plan_id: string;
  plan_nombre: string;
  cantidad: number;
}

export interface TimelinePoint {
  periodo: string; // YYYY-MM or YYYY-MM-DD según groupBy
  altas: number;
  bajas: number;
}

export interface OverdueSubscription {
  subscription_id: string;
  cliente?: string;
  plan?: string;
  property_alias?: string;
  fecha_vencimiento?: string;
  monto?: number;
  dias_atraso?: number;
}

export interface RecurringService {
  work_type_id: string | null;
  nombre: string;
  cantidad: number;
  descripcion?: string | null;
}

type DateRange = { from?: string; to?: string };

const unwrap = <T>(res: any): T => {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data !== undefined) return res.data as T;
    if ('success' in res && res.success && 'data' in res) return res.data as T;
  }
  return res as T;
};

const buildQuery = (params?: Record<string, string | number | undefined>): string => {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  const query = qs.toString();
  return query ? `?${query}` : '';
};

export async function fetchAdminSummary(range?: DateRange): Promise<AdminSummary> {
  const query = buildQuery(range);
  const res = await opsApi.get<AdminSummary>(`/metrics/admin/resumen${query}`);
  return unwrap<AdminSummary>(res);
}

export async function fetchPlanBreakdown(range?: DateRange): Promise<PlanBreakdown[]> {
  const query = buildQuery(range);
  const res = await opsApi.get<PlanBreakdown[]>(`/metrics/admin/suscripciones-por-plan${query}`);
  const data = unwrap<PlanBreakdown[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscriptionsTimeline(params?: DateRange & { groupBy?: 'day' | 'month' }): Promise<TimelinePoint[]> {
  const query = buildQuery(params);
  const res = await opsApi.get<TimelinePoint[]>(`/metrics/admin/altas-bajas-timeline${query}`);
  const data = unwrap<TimelinePoint[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchOverdueSubscriptions(): Promise<OverdueSubscription[]> {
  const res = await opsApi.get<OverdueSubscription[]>(`/metrics/admin/suscripciones-vencidas`);
  const data = unwrap<OverdueSubscription[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchRecurringServices(range?: DateRange): Promise<RecurringService[]> {
  const query = buildQuery(range);
  const res = await opsApi.get<RecurringService[]>(`/metrics/admin/servicios-recurrentes${query}`);
  const data = unwrap<RecurringService[]>(res);
  return Array.isArray(data) ? data : [];
}
