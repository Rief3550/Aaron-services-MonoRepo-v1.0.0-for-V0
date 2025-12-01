/**
 * Subscription List Component
 * Presentation layer - Lista de suscripciones usando DataTable reutilizable
 * Estructura replicable desde usuarios
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  fetchSubscriptions,
  cancelSubscription,
  changeSubscriptionState,
  type Subscription,
} from '@/lib/subscriptions/service';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

interface SubscriptionListProps {
  onEdit: (subscription: Subscription) => void;
  onRefresh?: () => void;
  filters?: { userId?: string; status?: string };
}

export function SubscriptionList({ onEdit, onRefresh, filters }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubscriptions(filters, { admin: true });
      setSubscriptions(data);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar suscripciones');
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [filters]);

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta suscripción?')) {
      return;
    }

    try {
      await cancelSubscription(id);
      await loadSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar suscripción');
    }
  };

  const handleStateChange = async (subscription: Subscription, newState: string) => {
    try {
      await changeSubscriptionState(subscription.id, newState);
      await loadSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatCurrency = (amount?: number, currency = 'ARS') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
    }).format(amount);
  };

  // Configuración de columnas para DataTable
  const columns: TableColumn<Subscription>[] = [
    {
      key: 'client',
      label: 'Cliente',
      sortable: true,
      render: (subscription) => (
        <div>
          <div className="font-medium text-gray-900">
            {subscription.client?.nombreCompleto || subscription.client?.email || 'N/A'}
          </div>
          {subscription.client?.email && (
            <div className="text-xs text-gray-500">{subscription.client.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'property',
      label: 'Propiedad',
      sortable: false,
      render: (subscription) => (
        <span className="text-gray-600">
          {subscription.property?.address || subscription.property?.alias || '-'}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      render: (subscription) => (
        <div>
          <div className="font-medium text-gray-900">{subscription.plan?.name || 'N/A'}</div>
          <div className="text-xs text-gray-500">
            {formatCurrency(
              subscription.montoMensual || subscription.plan?.price,
              subscription.moneda || subscription.plan?.currency
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      align: 'center',
      render: (subscription) => {
        const statusMap: Record<string, string> = {
          ACTIVE: 'ACTIVE',
          PAST_DUE: 'PAST_DUE',
          SUSPENDED: 'SUSPENDED',
          CANCELED: 'CANCELLED',
          GRACE: 'PAST_DUE',
          REVISION: 'SUSPENDED',
          PAUSED: 'SUSPENDED',
        };
        const mappedStatus = statusMap[subscription.status] || subscription.status;
        return <StatusBadge state={mappedStatus as any} />;
      },
    },
    {
      key: 'dates',
      label: 'Fechas',
      sortable: false,
      render: (subscription) => (
        <div className="text-sm">
          <div className="text-gray-900">Inicio: {formatDate(subscription.fechaInicio)}</div>
          {subscription.nextChargeAt && (
            <div className="text-xs text-gray-500">
              Próx: {formatDate(subscription.nextChargeAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      align: 'right',
      render: (subscription) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(subscription)}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Editar
          </button>
          {subscription.status !== 'CANCELED' && (
            <button
              onClick={() => handleCancel(subscription.id)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Cancelar
            </button>
          )}
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
          onClick={loadSubscriptions}
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
        data={subscriptions}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay suscripciones registradas"
      />
    </div>
  );
}
