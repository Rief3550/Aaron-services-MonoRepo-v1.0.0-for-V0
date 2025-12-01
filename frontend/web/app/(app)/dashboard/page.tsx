/**
 * Página de Dashboard
 * Presentation layer - Vista principal del backoffice
 */

'use client';

import { useEffect, useState } from 'react';
import { KPIcards } from '@/components/operator/KPIcards';
import { OrdersStatusChart } from '@/components/operator/OrdersStatusChart';
import { BudgetCard, type OrderState } from '@/components/ui/budget-card';
import { OrderStateModal } from '@/components/operator/OrderStateModal';
import { DashboardMap } from '@/components/dashboard/DashboardMap';
import { opsApi } from '@/lib/api/services';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorkOrder {
  id: string;
  serviceCategory: string;
  state: string;
  address: string;
  createdAt: string;
  operator?: string;
  lat?: number;
  lng?: number;
  client?: {
    nombreCompleto?: string;
    razonSocial?: string;
  };
}

interface Crew {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  availability: string;
  members: any;
  state: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para modal
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Map data
  const [mapOrders, setMapOrders] = useState<any[]>([]);
  const [mapCrews, setMapCrews] = useState<any[]>([]);
  
  // Contadores por estado para BudgetCards
  const [orderStats, setOrderStats] = useState<Record<OrderState, number>>({
    PENDIENTE: 0,
    ASIGNADA: 0,
    EN_PROGRESO: 0,
    FINALIZADA: 0,
    CANCELADA: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoading(true);
      const [ordersResult, crewsResult] = await Promise.all([
        opsApi.get<WorkOrder[]>('/work-orders'),
        opsApi.get<Crew[]>('/crews')
      ]);

      if (ordersResult.success && ordersResult.data) {
        // Asegurar que orders sea un array
        const orders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
        setRecentOrders(orders.slice(0, 5));
        
        // Load map data (filter orders with coordinates)
        setMapOrders(orders.filter(o => o.lat && o.lng));

        // Load crews map data
        if (crewsResult.success && crewsResult.data) {
          const crews = Array.isArray(crewsResult.data) ? crewsResult.data : [];
          setMapCrews(crews.filter(c => c.lat && c.lng));
        } else {
          setMapCrews([]);
        }
        
        // Calcular estadísticas por estado
        const stats: Record<OrderState, number> = {
          PENDIENTE: orders.filter(o => o.state === 'PENDIENTE').length,
          ASIGNADA: orders.filter(o => o.state === 'ASIGNADA').length,
          EN_PROGRESO: orders.filter(o => o.state === 'EN_PROGRESO').length,
          FINALIZADA: orders.filter(o => o.state === 'FINALIZADA').length,
          CANCELADA: orders.filter(o => o.state === 'CANCELADA').length,
        };
        setOrderStats(stats);
      } else {
        // No hay datos - mostrar estado vacío
        setRecentOrders([]);
        setMapOrders([]);
        setMapCrews([]);
        setOrderStats({
          PENDIENTE: 0,
          ASIGNADA: 0,
          EN_PROGRESO: 0,
          FINALIZADA: 0,
          CANCELADA: 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // En caso de error, mostrar estado vacío
      setRecentOrders([]);
      setMapOrders([]);
      setMapCrews([]);
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
    loadDashboardData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Operativo</h1>
          <p className="mt-1 text-sm text-gray-500">Vista general de operaciones</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* KPI Cards de Operador */}
      <section>
        <KPIcards />
      </section>

      {/* Layout Grid: Estados (Matriz) y Gráfico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(38,57,77,0.08)] border border-[#F2F4F7] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-[#1F2C3D]">Estado de Órdenes</h3>
            <span className="text-sm font-medium text-[#98B0C8]">Actualizado en tiempo real</span>
          </div>
          <BudgetCard
            state="PENDIENTE"
            count={orderStats.PENDIENTE}
            onClick={() => router.push('/ordenes?state=PENDIENTE')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 mt-4">
            <BudgetCard
              state="ASIGNADA"
              count={orderStats.ASIGNADA}
              onClick={() => router.push('/ordenes?state=ASIGNADA')}
            />
            <BudgetCard
              state="EN_PROGRESO"
              count={orderStats.EN_PROGRESO}
              onClick={() => router.push('/ordenes?state=EN_PROGRESO')}
            />
            <BudgetCard
              state="FINALIZADA"
              count={orderStats.FINALIZADA}
              onClick={() => router.push('/ordenes?state=FINALIZADA')}
            />
            <BudgetCard
              state="CANCELADA"
              count={orderStats.CANCELADA}
              onClick={() => router.push('/ordenes?state=CANCELADA')}
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(38,57,77,0.08)] border border-[#F2F4F7] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-[#1F2C3D]">Evolución semanal</h3>
          </div>
          <div className="w-full h-[320px]">
            <OrdersStatusChart />
          </div>
        </section>
      </div>

      {/* Mapa de Órdenes y Cuadrillas */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DashboardMap orders={mapOrders} crews={mapCrews} />
      </section>

      {/* Recent Orders Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Órdenes</h2>
          <Link href="/ordenes" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ID / Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado (Acción)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {order.serviceCategory}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {order.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {order.operator || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge 
                        state={order.state} 
                        onClick={() => handleOpenModal(order)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Cambio de Estado */}
      {selectedOrder && (
        <OrderStateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={selectedOrder}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
}

function StatusBadge({ state, onClick }: { state: string; onClick?: () => void }) {
  const styles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    ASIGNADA: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    EN_PROGRESO: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    FINALIZADA: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    CANCELADA: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  };

  const style = styles[state as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <button 
        onClick={onClick}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${style}`}
        title="Clic para cambiar estado"
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60`}></span>
      {state}
    </button>
  );
}
