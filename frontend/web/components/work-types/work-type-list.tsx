/**
 * WorkType List Component
 * Presentation layer - Lista de tipos de trabajo usando DataTable reutilizable
 * Estructura replicable desde usuarios
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  fetchWorkTypes,
  deleteWorkType,
  updateWorkType,
  type WorkType,
} from '@/lib/work-types/api';

interface WorkTypeListProps {
  onEdit: (workType: WorkType) => void;
  refreshKey?: number;
}

export function WorkTypeList({ onEdit, refreshKey }: WorkTypeListProps) {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkTypes({ admin: true });
      setWorkTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de trabajo');
      console.error('Error loading work types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkTypes();
  }, [loadWorkTypes, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de trabajo?')) {
      return;
    }

    try {
      await deleteWorkType(id);
      await loadWorkTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar tipo de trabajo');
    }
  };

  const handleToggleActive = async (workType: WorkType) => {
    try {
      await updateWorkType(workType.id, { activo: !workType.activo });
      await loadWorkTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar tipo de trabajo');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Configuración de columnas para DataTable
  const columns: TableColumn<WorkType>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (workType) => (
        <div>
          <div className="font-medium text-gray-900">{workType.nombre}</div>
          {workType.descripcion && (
            <div className="text-xs text-gray-500">{workType.descripcion}</div>
          )}
        </div>
      ),
    },
    {
      key: 'costoBase',
      label: 'Costo Base',
      sortable: true,
      render: (workType) => (
        <span className="text-gray-600">{formatCurrency(workType.costoBase)}</span>
      ),
    },
    {
      key: 'unidad',
      label: 'Unidad',
      sortable: false,
      render: (workType) => (
        <span className="text-gray-600">{workType.unidad || '-'}</span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      align: 'center',
      render: (workType) => (
        <StatusBadge
          state={workType.activo ? 'ACTIVE' : 'INACTIVE'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      align: 'right',
      render: (workType) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(workType)}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => handleToggleActive(workType)}
            className={`text-sm font-medium ${
              workType.activo
                ? 'text-orange-600 hover:text-orange-900'
                : 'text-green-600 hover:text-green-900'
            }`}
          >
            {workType.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={() => handleDelete(workType.id)}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
          >
            Eliminar
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
          onClick={loadWorkTypes}
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
        data={workTypes}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay tipos de trabajo registrados"
      />
    </div>
  );
}
