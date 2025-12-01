/**
 * Gestión de Pagos - Placeholder
 * Presentación simple mientras se conecta listado real de payments
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

type Payment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paidAt?: string;
  createdAt?: string;
  note?: string;
  dueDate?: string;
  subscriptionId?: string;
  subscription?: {
    id: string;
    plan?: { name: string };
  };
};

type Subscription = { id: string; plan: { name: string } };

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [form, setForm] = useState({ subscriptionId: '', amount: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchJson = async (path: string, init?: RequestInit) => {
        const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json();
      };

      const [payRes, subsRes] = await Promise.all([
        fetchJson('/ops/payments'),
        fetchJson('/ops/subscriptions'),
      ]);

      const payData = (payRes?.data as any) || payRes;
      const subData = (subsRes?.data as any) || subsRes;

      setPayments(Array.isArray(payData) ? payData : []);
      setSubs(
        Array.isArray(subData)
          ? subData.map((s: any) => ({ id: s.id, plan: s.plan || { name: 'Plan' } }))
          : [],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar pagos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async () => {
    if (!form.subscriptionId || !form.amount) return;
    setLoading(true);
    setError(null);
    try {
      await fetch('/ops/payments/manual', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: form.subscriptionId,
          amount: Number(form.amount),
          note: form.note || undefined,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        return res.json();
      });
      setForm({ subscriptionId: '', amount: '', note: '' });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear pago');
    } finally {
      setLoading(false);
    }
  };

  const subsMap = useMemo(
    () =>
      subs.reduce<Record<string, string>>((acc, s) => {
        acc[s.id] = s.plan?.name || s.id;
        return acc;
      }, {}),
    [subs],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-sm text-gray-500">Historial y creación manual (admin).</p>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}

      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Crear pago manual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Suscripción</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.subscriptionId}
              onChange={(e) => setForm((p) => ({ ...p, subscriptionId: e.target.value }))}
            >
              <option value="">Seleccionar</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {subsMap[s.id]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Monto (ARS)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Nota</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Referencia, método, etc."
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Pagos registrados</h3>
        {loading ? (
          <div className="text-gray-500 text-sm">Cargando...</div>
        ) : payments.length === 0 ? (
          <div className="text-gray-500 text-sm">No hay pagos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="px-4 py-2 text-left">Suscripción</th>
                  <th className="px-4 py-2 text-left">Monto</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Pagado</th>
                  <th className="px-4 py-2 text-left">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{subsMap[p.subscriptionId || ''] || '—'}</div>
                      <div className="text-xs text-gray-500">{p.subscriptionId}</div>
                    </td>
                    <td className="px-4 py-2">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: p.currency || 'ARS' }).format(
                        p.amount || 0,
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          p.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-gray-800">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-AR') : '—'}
                      </div>
                      {p.dueDate && (
                        <div className="text-xs text-gray-500">Vence: {new Date(p.dueDate).toLocaleDateString('es-AR')}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
