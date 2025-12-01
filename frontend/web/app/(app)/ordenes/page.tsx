'use client';

import React, { useEffect, useState } from 'react';
import { opsApi } from '@/lib/api/services';
import { BudgetCardGrid, type OrderState } from '@/components/ui/budget-card';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { OrderStateModal } from '@/components/operator/OrderStateModal';
import { CreateWorkOrderModal } from '@/components/operator/CreateWorkOrderModal';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  serviceCategory: string;
  state: string;
  address: string;
  createdAt: string;
  crew?: { name: string };
  prioridad?: string;
  workType?: { nombre: string };
  client?: { nombreCompleto?: string; razonSocial?: string; email?: string };
}

export default function OrdenesPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>('');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('');
  const [filterWorkTypeId, setFilterWorkTypeId] = useState<string>('');
  const [filterCrewId, setFilterCrewId] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  
  // Estado para modales
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Estadísticas por estado
  const [orderStats, setOrderStats] = useState<Record<OrderState, number>>({
    PENDIENTE: 0,
    ASIGNADA: 0,
    EN_PROGRESO: 0,
    FINALIZADA: 0,
    CANCELADA: 0,
  });
  
  // Removido: Ahora la paginación está dentro de DataTable

  useEffect(() => {
    loadOrders();
  }, [filterState, filterPrioridad, filterWorkTypeId, filterCrewId, filterFrom, filterTo, filterSearch]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filterState) params.append('state', filterState);
    if (filterPrioridad) params.append('prioridad', filterPrioridad);
    if (filterWorkTypeId) params.append('workTypeId', filterWorkTypeId);
    if (filterCrewId) params.append('crewId', filterCrewId);
    if (filterFrom) params.append('from', filterFrom);
    if (filterTo) params.append('to', filterTo);
    if (filterSearch) params.append('search', filterSearch);
    return params.toString() ? `/work-orders?${params.toString()}` : '/work-orders';
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const endpoint = buildQuery();
      const result = await opsApi.get<WorkOrder[]>(endpoint);
      
      let fetchedOrders: WorkOrder[] = [];

      if (result.success && result.data) {
        // Asegurar que sea un array
        fetchedOrders = Array.isArray(result.data) ? result.data : [];
      } else {
        fetchedOrders = [];
      }

      setOrders(fetchedOrders);
      
      // Calcular estadísticas por estado
      const stats: Record<OrderState, number> = {
        PENDIENTE: fetchedOrders.filter(o => o.state === 'PENDIENTE').length,
        ASIGNADA: fetchedOrders.filter(o => o.state === 'ASIGNADA').length,
        EN_PROGRESO: fetchedOrders.filter(o => o.state === 'EN_PROGRESO').length,
        FINALIZADA: fetchedOrders.filter(o => o.state === 'FINALIZADA').length,
        CANCELADA: fetchedOrders.filter(o => o.state === 'CANCELADA').length,
      };
      setOrderStats(stats);

    } catch (error) {
      console.error('Error loading orders:', error);
      // En caso de error, mostrar estado vacío
      setOrders([]);
      setOrderStats({
        PENDIENTE: 0,
        ASIGNADA: 0,
        EN_PROGRESO: 0,
        FINALIZADA: 0,
        CANCELADA: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalUpdate = () => {
    loadOrders();
  };

  // Mapear estado string a StateType
  const getStateType = (state: string): OrderState => {
    const stateMap: Record<string, OrderState> = {
      PENDIENTE: 'PENDIENTE',
      ASIGNADA: 'ASIGNADA',
      EN_PROGRESO: 'EN_PROGRESO',
      FINALIZADA: 'FINALIZADA',
      CANCELADA: 'CANCELADA',
    };
    return stateMap[state] || 'PENDIENTE';
  };

  // Definir columnas para la tabla
  const columns: TableColumn<WorkOrder>[] = [
    {
      key: 'id',
      label: 'ID / Fecha',
      sortable: true,
      render: (order) => (
        <div>
          <div className="font-medium">#{order.id.slice(0, 8)}</div>
          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'serviceCategory',
      label: 'Servicio',
      sortable: true,
      render: (order) => (
        <Link href={`/ordenes/${order.id}`} className="hover:text-blue-600 transition-colors">
            {order.serviceCategory}
        </Link>
      )
    },
    {
      key: 'client',
      label: 'Cliente',
      sortable: true,
      render: (order) => (
        <div>
          <p className="font-medium text-gray-900">
            {order.client?.nombreCompleto || order.client?.razonSocial || 'Sin cliente'}
          </p>
          {order.client?.email && (
            <p className="text-xs text-gray-500">{order.client.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Dirección',
      sortable: true,
    },
    {
      key: 'crew',
      label: 'Cuadrilla',
      sortable: false,
      render: (order) => <span>{order.crew?.name || '-'}</span>,
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      sortable: true,
      align: 'center',
      render: (order) => {
        const prioridad = order.prioridad || 'MEDIA';
        const colors: Record<string, string> = {
          'EMERGENCIA': 'bg-red-100 text-red-800 border-red-200',
          'ALTA': 'bg-orange-100 text-orange-800 border-orange-200',
          'MEDIA': 'bg-yellow-100 text-yellow-800 border-yellow-200',
          'BAJA': 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[prioridad] || colors['MEDIA']}`}>
            {prioridad}
          </span>
        );
      },
    },
    {
      key: 'state',
      label: 'Estado (Acción)',
      sortable: true,
      align: 'center',
      render: (order) => (
        <StatusBadge 
            state={getStateType(order.state)} 
            onClick={() => handleOpenModal(order)}
        />
      ),
    },
    // Columna de acciones eliminada - la acción ahora es clickear el estado
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="mt-1 text-sm text-gray-600">Gestión y seguimiento de servicios</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
        >
          Nueva Orden
        </button>
      </div>

      {/* Budget Cards - Estados de Órdenes */}
      <BudgetCardGrid
        budgets={[
          { 
            state: 'PENDIENTE', 
            count: orderStats.PENDIENTE, 
            onClick: () => {
              setFilterState('PENDIENTE');
            }
          },
          { 
            state: 'ASIGNADA', 
            count: orderStats.ASIGNADA, 
            onClick: () => {
              setFilterState('ASIGNADA');
            }
          },
          { 
            state: 'EN_PROGRESO', 
            count: orderStats.EN_PROGRESO, 
            onClick: () => {
              setFilterState('EN_PROGRESO');
            }
          },
          { 
            state: 'FINALIZADA', 
            count: orderStats.FINALIZADA, 
            onClick: () => {
              setFilterState('FINALIZADA');
            }
          },
          { 
            state: 'CANCELADA', 
            count: orderStats.CANCELADA, 
            onClick: () => {
              setFilterState('CANCELADA');
            }
          },
        ]}
        context="orders"
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
          {/* Filters UI */}
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ASIGNADA">Asignada</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
          >
            <option value="">Todas las prioridades</option>
            <option value="EMERGENCIA">Emergencia</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
          <input
            type="date"
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Desde"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <input
            type="date"
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Hasta"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
          <input
            type="text"
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Buscar..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <DataTable
          data={orders}
          columns={columns}
          itemsPerPage={10}
          isLoading={loading}
          emptyMessage="No hay órdenes disponibles"
        />
      </div>

      {/* Modal de Cambio de Estado */}
      {selectedOrder && (
        <OrderStateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={selectedOrder}
          onUpdate={handleModalUpdate}
        />
      )}

      {/* Modal de Crear Orden */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadOrders();
        }}
      />
    </div>
  );
}
