/**
 * Crew List Component
 * Presentation layer - Lista de cuadrillas usando DataTable reutilizable
 * Estructura replicable desde usuarios
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { fetchCrews, updateCrewState, type Crew } from '@/lib/crews/service';
import { Loader } from '@/components/ui/loader';

interface CrewListProps {
  onEdit: (crew: Crew) => void;
  onRefresh?: () => void;
}

const STATE_COLORS: Record<string, string> = {
  desocupado: 'AVAILABLE',
  ocupado: 'BUSY',
  offline: 'INACTIVE',
  disponible: 'AVAILABLE',
  busy: 'BUSY',
};

export function CrewList({ onEdit, onRefresh }: CrewListProps) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCrews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCrews();
      setCrews(data);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuadrillas');
      console.error('Error loading crews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrews();
  }, []);

  const handleStateChange = async (crew: Crew, newState: string) => {
    try {
      await updateCrewState(crew.id, newState);
      await loadCrews(); // Recargar lista
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  const getStateDisplay = (state: string): string => {
    const stateMap: Record<string, string> = {
      desocupado: 'Desocupado',
      ocupado: 'Ocupado',
      offline: 'Offline',
      disponible: 'Disponible',
      busy: 'Ocupado',
    };
    return stateMap[state] || state;
  };

  // Configuración de columnas para DataTable
  const columns: TableColumn<Crew>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (crew) => (
        <div>
          <div className="font-medium text-gray-900">{crew.name}</div>
          {crew.zona && (
            <div className="text-xs text-gray-500">Zona: {crew.zona}</div>
          )}
        </div>
      ),
    },
    {
      key: 'members',
      label: 'Miembros',
      sortable: false,
      render: (crew) => {
        const members = crew.members || [];
        const count = Array.isArray(members) ? members.length : 0;
        return (
          <span className="text-gray-600">
            {count > 0 ? `${count} miembro${count !== 1 ? 's' : ''}` : 'Sin miembros'}
          </span>
        );
      },
    },
    {
      key: 'state',
      label: 'Estado',
      sortable: true,
      align: 'center',
      render: (crew) => {
        const stateKey = STATE_COLORS[crew.state] || crew.state;
        return (
          <StatusBadge
            state={stateKey === 'AVAILABLE' ? 'ACTIVE' : stateKey === 'BUSY' ? 'PAST_DUE' : 'INACTIVE'}
          />
        );
      },
    },
    {
      key: 'progress',
      label: 'Progreso',
      sortable: true,
      align: 'center',
      render: (crew) => {
        const progress = crew.progress || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      align: 'right',
      render: (crew) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(crew)}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Editar
          </button>
          {crew.state === 'desocupado' && (
            <button
              onClick={() => handleStateChange(crew, 'ocupado')}
              className="text-green-600 hover:text-green-900 text-sm font-medium"
            >
              Marcar Ocupado
            </button>
          )}
          {crew.state === 'ocupado' && (
            <button
              onClick={() => handleStateChange(crew, 'desocupado')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Marcar Disponible
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
          onClick={loadCrews}
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
        data={crews}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay cuadrillas registradas"
      />
    </div>
  );
}

