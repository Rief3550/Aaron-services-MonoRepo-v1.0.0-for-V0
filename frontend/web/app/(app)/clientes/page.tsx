'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { opsApi } from '@/lib/api/services';
import { StatusBadge } from '@/components/ui/status-badge';

interface Client {
  id: string;
  userId: string;
  nombreCompleto: string | null;
  razonSocial: string | null;
  tipoPersona: string;
  documento: string | null;
  email: string;
  telefono: string | null;
  estado: string;
  direccionFacturacion: string | null;
  ciudad: string | null;
  provincia: string | null;
  createdAt: string;
  properties?: { id: string; address: string; status: string }[];
  subscriptions?: { id: string; status: string; plan: { name: string } }[];
}

// Iconos
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const estadoColors: Record<string, string> = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ACTIVO': 'bg-green-100 text-green-800 border-green-200',
  'SUSPENDIDO': 'bg-orange-100 text-orange-800 border-orange-200',
  'INACTIVO': 'bg-red-100 text-red-800 border-red-200',
};

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    pendientes: 0,
    suspendidos: 0,
  });

  useEffect(() => {
    loadClients();
  }, [filterEstado]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      
      const endpoint = params.toString() ? `/clients?${params.toString()}` : '/clients';
      const result = await opsApi.get<Client[]>(endpoint);

      if (result.success && result.data) {
        setClients(result.data);
        // Calcular estadísticas
        const all = result.data;
        setStats({
          total: all.length,
          activos: all.filter(c => c.estado === 'ACTIVO').length,
          pendientes: all.filter(c => c.estado === 'PENDIENTE').length,
          suspendidos: all.filter(c => c.estado === 'SUSPENDIDO').length,
        });
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const displayName = c.nombreCompleto || c.razonSocial || c.email;
    const matchesSearch = 
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.documento && c.documento.includes(search));
    return matchesSearch;
  });

  const getDisplayName = (client: Client) => {
    return client.nombreCompleto || client.razonSocial || client.email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestión y seguimiento de clientes del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon />
          Nuevo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => setFilterEstado(filterEstado === 'ACTIVO' ? '' : 'ACTIVO')}
        >
          <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
          <div className="text-sm text-gray-500">Activos</div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-yellow-300 transition-colors"
          onClick={() => setFilterEstado(filterEstado === 'PENDIENTE' ? '' : 'PENDIENTE')}
        >
          <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
          onClick={() => setFilterEstado(filterEstado === 'SUSPENDIDO' ? '' : 'SUSPENDIDO')}
        >
          <div className="text-2xl font-bold text-orange-600">{stats.suspendidos}</div>
          <div className="text-sm text-gray-500">Suspendidos</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition duration-200"
              placeholder="Buscar por nombre, email, documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterIcon />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ACTIVO">Activo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suscripción</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/clientes/${client.id}`)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {getDisplayName(client).charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{getDisplayName(client)}</div>
                          <div className="text-xs text-gray-500">
                            {client.tipoPersona === 'EMPRESA' ? 'Empresa' : 'Individual'}
                            {client.documento && ` · ${client.documento}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.telefono || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.ciudad && client.provincia 
                        ? `${client.ciudad}, ${client.provincia}` 
                        : client.direccionFacturacion || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoColors[client.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {client.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {client.subscriptions && client.subscriptions.length > 0 ? (
                        <div>
                          <div className="text-gray-900">{client.subscriptions[0].plan?.name || 'Sin plan'}</div>
                          <div className="text-xs text-gray-500">{client.subscriptions[0].status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin suscripción</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="text-blue-600 group-hover:text-blue-800 flex items-center justify-end gap-1 transition-colors">
                        Ver Ficha
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredClients.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron clientes con ese criterio.
          </div>
        )}
      </div>

      {/* TODO: Modal de creación de cliente */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Cliente</h3>
            <p className="text-sm text-gray-500 mb-4">
              Para crear un nuevo cliente, el usuario debe registrarse desde la aplicación móvil.
              El proceso de alta incluye auditoría y verificación de domicilio.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



