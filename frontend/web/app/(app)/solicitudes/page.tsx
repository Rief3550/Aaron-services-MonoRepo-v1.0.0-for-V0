'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { LocationMapModal } from '@/components/solicitudes/LocationMapModal';
import { CreateManualClientModal } from '@/components/solicitudes/CreateManualClientModal';
import { fetchSolicitudes, type Solicitud } from '@/lib/solicitudes/api';
import { updateClientStatus } from '@/lib/clients/api';
import { EstadoCliente } from '@/lib/types/client';

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mapSolicitud, setMapSolicitud] = useState<Solicitud | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>(''); // '' = todos, 'PENDIENTE' = solo pendientes, etc.

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('[SolicitudesPage] Loading solicitudes con filtro:', estadoFilter || 'TODOS');
        const data = await fetchSolicitudes(estadoFilter || undefined);
        console.log('[SolicitudesPage] Solicitudes loaded:', data.length, data);
        setSolicitudes(data);
      } catch (error) {
        console.error('[SolicitudesPage] Error loading solicitudes:', error);
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estadoFilter]);

  const handleRowClick = (solicitud: Solicitud) => {
    console.log('[SolicitudesPage] handleRowClick called with:', solicitud);
    if (!solicitud || !solicitud.id) {
      console.error('[SolicitudesPage] Invalid solicitud:', solicitud);
      return;
    }
    setSelectedSolicitud(solicitud);
    setIsModalOpen(true);
    console.log('[SolicitudesPage] Modal should open now');
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Mapear estado de la UI al estado del backend
      let estadoBackend: EstadoCliente = 'PENDIENTE';
      if (newStatus === 'EN_REVISION') {
        estadoBackend = 'EN_PROCESO';
      } else if (newStatus === 'PROCESADO') {
        estadoBackend = 'ACTIVO';
      } else if (newStatus === 'RECHAZADA') {
        estadoBackend = 'SUSPENDIDO';
      }

      // Actualizar en el backend
      await updateClientStatus(id, { estado: estadoBackend });

      // Recargar los datos para reflejar el cambio (especialmente si cambia el filtro)
      setLoading(true);
      try {
        const data = await fetchSolicitudes(estadoFilter || undefined);
        setSolicitudes(data);
      } catch (error) {
        console.error('[SolicitudesPage] Error recargando datos:', error);
      } finally {
        setLoading(false);
      }

      // Actualizar el modal si está abierto
      if (selectedSolicitud && selectedSolicitud.id === id) {
        setSelectedSolicitud({ ...selectedSolicitud, status: newStatus, estadoCliente: estadoBackend });
      }

      console.log(`[SolicitudesPage] Estado actualizado: ${id} -> ${estadoBackend}`);
    } catch (error) {
      console.error('[SolicitudesPage] Error actualizando estado:', error);
      alert('Error al actualizar el estado. Por favor, intenta nuevamente.');
    }
  };

  const columns: TableColumn<Solicitud>[] = [
    {
      key: 'id',
      label: 'ID / Fecha',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">#{row.id ? (typeof row.id === 'string' ? row.id.slice(0, 8) : String(row.id).slice(0, 8)) : 'N/A'}</div>
          <div className="text-xs text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('es-AR') : '-'}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-700">{row.type}</span>,
    },
    {
      key: 'citizen',
      label: 'Solicitante',
      sortable: true,
    },
    {
      key: 'contact',
      label: 'Contacto',
      sortable: false,
      render: (row) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-1 text-xs">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${row.email}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline truncate max-w-[150px]">
                {row.email}
              </a>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1 text-xs">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${row.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">
                {row.phone}
              </a>
            </div>
          )}
          {!row.email && !row.phone && (
            <span className="text-xs text-gray-400">Sin contacto</span>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Ubicación',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{row.address}</span>
          {row.lat && row.lng && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMapSolicitud(row);
                setIsMapModalOpen(true);
              }}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
              title="Ver en mapa"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Mapa
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado (Acción)',
      sortable: true,
      align: 'center',
      render: (row) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:shadow-md hover:scale-105 transition-all ${
          row.status === 'PENDIENTE' || row.estadoCliente === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          row.status === 'EN_REVISION' || row.estadoCliente === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
          row.status === 'PROCESADO' || row.estadoCliente === 'ACTIVO' ? 'bg-green-100 text-green-800 border-green-200' :
          'bg-red-100 text-red-800 border-red-200'
        }`}
          title="Clic para gestionar solicitud"
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60"></span>
          {row.estadoCliente || row.status}
        </button>
      ),
    },
    // Columna de acciones eliminada
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevas Solicitudes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestión de registros de usuarios y solicitudes de servicio iniciales (SignUp)
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
        >
          Nueva Solicitud
        </button>
      </div>

      {/* Filtro de Estado */}
      <div className="rounded-lg bg-white shadow p-4">
        <div className="flex items-center gap-4">
          <label htmlFor="estado-filter" className="text-sm font-medium text-gray-700">
            Filtrar por Estado:
          </label>
          <select
            id="estado-filter"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 min-w-[200px]"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="ACTIVO">Activo</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          {estadoFilter && (
            <button
              onClick={() => setEstadoFilter('')}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <DataTable
          data={solicitudes}
          columns={columns}
          isLoading={loading}
          emptyMessage={estadoFilter ? `No hay solicitudes con estado ${estadoFilter}` : "No hay solicitudes pendientes"}
          itemsPerPage={10}
          onRowClick={handleRowClick}
        />
      </div>

      <SolicitudDetailModal
        key={selectedSolicitud?.id || 'modal'}
        isOpen={isModalOpen}
        onClose={() => {
          console.log('[SolicitudesPage] Closing modal');
          setIsModalOpen(false);
          setSelectedSolicitud(null);
        }}
        solicitud={selectedSolicitud}
        onUpdateStatus={handleUpdateStatus}
      />

      <LocationMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setMapSolicitud(null);
        }}
        lat={mapSolicitud?.lat}
        lng={mapSolicitud?.lng}
        address={mapSolicitud?.address}
        clientName={mapSolicitud?.citizen}
      />

      <CreateManualClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Recargar lista
          setEstadoFilter(''); // Resetear filtro para ver el nuevo si es necesario, o mantenerlo
          // Forzar recarga cambiando filtro o llamando a loadData si pudiera sacarlo del useEffect
          // Truco simple: togglear filtro o setear loading
          window.location.reload(); // Más seguro para asegurar que todo se refresque
        }}
      />
    </div>
  );
}
