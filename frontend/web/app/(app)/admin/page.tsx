'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import {
  fetchAdminSummary,
  fetchOverdueSubscriptions,
  fetchPlanBreakdown,
  fetchSubscriptionsTimeline,
  fetchRecurringServices,
  type AdminSummary,
  type OverdueSubscription,
  type PlanBreakdown,
  type TimelinePoint,
  type RecurringService,
} from '@/lib/metrics/admin';

const numberFmt = new Intl.NumberFormat('es-AR');
const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });

type Tone = 'positive' | 'negative' | 'neutral';

function KpiCard({ title, value, change, tone = 'neutral' }: { title: string; value: string; change?: string; tone?: Tone }) {
  const changeColor = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : 'text-gray-500';
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
        {change && <span className={`text-sm font-medium ${changeColor}`}>{change}</span>}
      </div>
    </div>
  );
}

const getMonthRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString(), to: now.toISOString() };
};

export default function AdminDashboardPage() {
  const { user, hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [plans, setPlans] = useState<PlanBreakdown[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [overdue, setOverdue] = useState<OverdueSubscription[]>([]);
  const [services, setServices] = useState<RecurringService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole('ADMIN'))) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = getMonthRange();
        const [summaryRes, planRes, timelineRes, overdueRes, servicesRes] = await Promise.all([
          fetchAdminSummary(range),
          fetchPlanBreakdown(range),
          fetchSubscriptionsTimeline({ ...range, groupBy: 'month' }),
          fetchOverdueSubscriptions(),
          fetchRecurringServices(range),
        ]);
        setSummary(summaryRes ?? null);
        setPlans(planRes ?? []);
        setTimeline(timelineRes ?? []);
        setOverdue(overdueRes ?? []);
        setServices(servicesRes ?? []);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error al cargar métricas';
        setError(message);
        console.error('[AdminDashboard] Error loading metrics', e);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && hasRole('ADMIN')) {
      void loadMetrics();
    }
  }, [authLoading, isAuthenticated, hasRole]);

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Cargando métricas...</div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRole('ADMIN')) {
    return null;
  }

  const safeSummary: AdminSummary = summary || {
    suscriptores_totales: 0,
    altas_periodo: 0,
    bajas_periodo: 0,
    tasa_churn: 0,
    ingresos_suscripciones_activas: 0,
    monto_vencido: 0,
    monto_por_vencer_30d: 0,
    porcentaje_perdidas_morosidad: 0,
  };

  const totalPlans = plans.reduce((sum, p) => sum + (p.cantidad || 0), 0);
  const sortedTimeline = [...timeline].sort((a, b) => (a.periodo > b.periodo ? 1 : -1));
  const maxTimeline = sortedTimeline.length
    ? Math.max(...sortedTimeline.map((t) => Math.max(t.altas || 0, t.bajas || 0)))
    : 0;
  const topServices = services.slice(0, 5);

  const exposure = safeSummary.ingresos_suscripciones_activas + (safeSummary.monto_vencido || 0);
  const overdueRatio = exposure > 0 ? (safeSummary.monto_vencido / exposure) * 100 : 0;

  const formatNumber = (v: number | null | undefined) => numberFmt.format(v || 0);
  const formatCurrency = (v: number | null | undefined) => currencyFmt.format(v || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Visión ejecutiva: suscripciones, ingresos y riesgo</p>
        </div>
        <div className="text-sm text-gray-500">
          Bienvenido, {user?.fullName || 'Admin'}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Suscriptores Totales" value={formatNumber(safeSummary.suscriptores_totales)} />
        <KpiCard title="Ingresos (Mes)" value={formatCurrency(safeSummary.ingresos_suscripciones_activas)} />
        <KpiCard title="Altas (Mes)" value={formatNumber(safeSummary.altas_periodo)} />
        <KpiCard
          title="Bajas (Mes)"
          value={formatNumber(safeSummary.bajas_periodo)}
          change={`${(safeSummary.tasa_churn * 100).toFixed(1)}% churn`}
          tone="negative"
        />
      </div>

      {/* Charts / Blocks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Altas vs Bajas</h3>
          {sortedTimeline.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-gray-400 bg-gray-50 rounded-md">
              Sin datos en el rango seleccionado
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Altas</div>
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Bajas</div>
              </div>
              <div className="flex items-end gap-3 overflow-x-auto pb-2">
                {sortedTimeline.map((point) => {
                  const base = maxTimeline || 1;
                  const altaHeight = Math.max(6, Math.round(((point.altas || 0) / base) * 120));
                  const bajaHeight = Math.max(6, Math.round(((point.bajas || 0) / base) * 120));
                  return (
                    <div key={point.periodo} className="flex flex-col items-center min-w-[48px]">
                      <div className="flex items-end gap-1 h-32 w-full justify-center">
                        <div
                          className="w-3 rounded-t bg-emerald-500"
                          style={{ height: `${altaHeight}px` }}
                          title={`Altas ${formatNumber(point.altas)}`}
                        />
                        <div
                          className="w-3 rounded-t bg-red-500"
                          style={{ height: `${bajaHeight}px` }}
                          title={`Bajas ${formatNumber(point.bajas)}`}
                        />
                      </div>
                      <span className="mt-1 text-[11px] text-gray-600">{point.periodo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Suscripciones por Plan</h3>
          {plans.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-gray-400 bg-gray-50 rounded-md">
              Sin datos de planes
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const pct = totalPlans ? Math.round((plan.cantidad / totalPlans) * 100) : 0;
                return (
                  <div key={plan.plan_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                      <span>{plan.plan_nombre}</span>
                      <span className="text-gray-600">
                        {formatNumber(plan.cantidad)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Financial/Debt Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Ingresos vs Vencimientos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Ingresos (postados)</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(safeSummary.ingresos_suscripciones_activas)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Monto vencido</span>
              <span className="font-semibold text-red-600">{formatCurrency(safeSummary.monto_vencido)}</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Exposición</span>
                <span>{overdueRatio.toFixed(1)}% morosidad</span>
              </div>
              <div className="mt-1 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-3 bg-red-500"
                  style={{ width: `${Math.min(100, Math.max(0, overdueRatio))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Servicios más solicitados</h3>
          {topServices.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-gray-400 bg-gray-50 rounded-md">
              Sin datos de servicios
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((s) => {
                const max = topServices[0]?.cantidad || 1;
                const pct = max ? Math.round((s.cantidad / max) * 100) : 0;
                return (
                  <div key={s.work_type_id || s.nombre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-gray-800">
                      <span>{s.nombre}</span>
                      <span className="text-gray-600">{formatNumber(s.cantidad)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Suscripciones Vencidas</h3>
          {overdue.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-gray-400 bg-gray-50 rounded-md">
              No hay suscripciones vencidas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Días</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {overdue.slice(0, 6).map((item) => (
                    <tr key={item.subscription_id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.cliente || 'N/A'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.plan || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatCurrency(item.monto)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-red-600">{item.dias_atraso ?? 0}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {item.fecha_vencimiento ? dateFmt.format(new Date(item.fecha_vencimiento)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
