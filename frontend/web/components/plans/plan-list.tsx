/**
 * Plan List Component
 * Presentation layer - Lista de planes usando DataTable reutilizable
 * Estructura replicable desde usuarios
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  fetchPlans,
  type Plan,
} from '@/lib/plans/api';
import { Loader } from '@/components/ui/loader';

interface PlanListProps {
  onEdit: (plan: Plan) => void;
  onRefresh?: () => void;
}

export function PlanList({ onEdit, onRefresh }: PlanListProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPlans(false); // Mostrar todos, no solo activos
      setPlans(data);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planes');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleToggleActive = async (plan: Plan) => {
    try {
      // Actualizar estado activo/inactivo
      const { updatePlan } = await import('@/lib/plans/api');
      await updatePlan(plan.id, { active: !plan.active });
      await loadPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar plan');
    }
  };

  const formatCurrency = (amount: number, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
    }).format(amount);
  };

  // Configuración de columnas para DataTable
  const columns: TableColumn<Plan>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (plan) => (
        <div>
          <div className="font-medium text-gray-900">{plan.name}</div>
          {plan.description && (
            <div className="text-xs text-gray-500">{plan.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      sortable: true,
      render: (plan) => (
        <div>
          <div className="font-medium text-gray-900">
            {formatCurrency(Number(plan.price), plan.currency)}
          </div>
          {plan.billingPeriod && (
            <div className="text-xs text-gray-500">/{plan.billingPeriod === 'MONTHLY' ? 'mes' : plan.billingPeriod}</div>
          )}
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      align: 'center',
      render: (plan) => (
        <StatusBadge
          state={plan.active ? 'ACTIVE' : 'INACTIVE'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      align: 'right',
      render: (plan) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(plan)}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => handleToggleActive(plan)}
            className={`text-sm font-medium ${
              plan.active
                ? 'text-orange-600 hover:text-orange-900'
                : 'text-green-600 hover:text-green-900'
            }`}
          >
            {plan.active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-800">{error}</p>
        <Button
          text="Reintentar"
          onClick={loadPlans}
          variant="secondary"
          size="sm"
          className="mt-2"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <DataTable
        data={plans}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay planes registrados"
      />
    </div>
  );
}

