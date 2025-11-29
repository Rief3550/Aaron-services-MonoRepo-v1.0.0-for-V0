/**
 * Página de Gestión de Cuadrillas
 * Presentation layer - Lista y estado de cuadrillas con historial de trabajos
 */

'use client';

import { useEffect, useState } from 'react';
import { opsApi } from '@/lib/api/services';

interface WorkOrder {
    id: string;
    titulo?: string;
    serviceCategory: string;
    state: string;
    address: string;
    createdAt: string;
    completedAt?: string;
    client?: {
        nombreCompleto?: string;
        razonSocial?: string;
    };
    property?: {
        alias?: string;
        address?: string;
    };
}

interface Crew {
    id: string;
    name: string;
    state: string;
    availability: string;
    progress: number;
    zona?: string;
    members?: string[] | Array<{ id: string; name?: string }>;
    notes?: string;
    lat?: number;
    lng?: number;
    createdAt?: string;
    updatedAt?: string;
    _count?: {
        workOrders: number;
    };
}

interface CrewWithOrders extends Crew {
    workOrders?: WorkOrder[];
}

export default function CrewsPage() {
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrew, setSelectedCrew] = useState<CrewWithOrders | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        loadCrews();
    }, []);

    const loadCrews = async () => {
        try {
            setLoading(true);
            const result = await opsApi.get<Crew[]>('/crews');
            if (result.success && result.data) {
                setCrews(Array.isArray(result.data) ? result.data : [result.data]);
            }
        } catch (error) {
            console.error('Error loading crews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCrewDetail = async (crewId: string) => {
        try {
            setLoadingDetail(true);
            const result = await opsApi.get<CrewWithOrders>(`/crews/${crewId}`);
            if (result.success && result.data) {
                setSelectedCrew(result.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Error loading crew detail:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = (crew: Crew) => {
        void loadCrewDetail(crew.id);
    };

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'desocupado':
                return 'bg-green-100 text-green-800';
            case 'en_trabajo':
            case 'ocupado':
                return 'bg-blue-100 text-blue-800';
            case 'offline':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getAvailabilityColor = (availability: string) => {
        switch (availability) {
            case 'AVAILABLE':
                return 'bg-green-100 text-green-800';
            case 'BUSY':
                return 'bg-orange-100 text-orange-800';
            case 'OFFLINE':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getAvailabilityLabel = (availability: string) => {
        switch (availability) {
            case 'AVAILABLE':
                return 'Disponible';
            case 'BUSY':
                return 'Ocupada';
            case 'OFFLINE':
                return 'Offline';
            default:
                return availability;
        }
    };

    const getStateLabel = (state: string) => {
        const stateMap: Record<string, string> = {
            'desocupado': 'Desocupado',
            'ocupado': 'Ocupado',
            'en_trabajo': 'En Trabajo',
            'offline': 'Offline',
        };
        return stateMap[state] || state;
    };

    const formatMembers = (members?: string[] | Array<{ id: string; name?: string }>): string => {
        if (!members || members.length === 0) return 'Sin miembros';
        if (Array.isArray(members)) {
            if (typeof members[0] === 'string') {
                return `${members.length} miembro${members.length > 1 ? 's' : ''}`;
            } else {
                return `${members.length} miembro${members.length > 1 ? 's' : ''}`;
            }
        }
        return 'Sin miembros';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuadrillas</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de equipos y disponibilidad</p>
                </div>
                <button
                    onClick={loadCrews}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Actualizar
                </button>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : crews.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-gray-500">
                        <p>No hay cuadrillas registradas</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Zona
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Miembros
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Disponibilidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Trabajos
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {crews.map((crew) => (
                                <tr key={crew.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                        {crew.name}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {crew.zona || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {formatMembers(crew.members)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(crew.state)}`}>
                                            {getStateLabel(crew.state)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getAvailabilityColor(crew.availability)}`}>
                                            {getAvailabilityLabel(crew.availability)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {crew._count?.workOrders || 0} trabajo{crew._count?.workOrders !== 1 ? 's' : ''}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleViewDetail(crew)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Detalle de Cuadrilla */}
            {showDetailModal && selectedCrew && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedCrew.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedCrew.zona && `Zona: ${selectedCrew.zona}`}
                                    {selectedCrew.zona && selectedCrew._count && ' • '}
                                    {selectedCrew._count && `${selectedCrew._count.workOrders} trabajo${selectedCrew._count.workOrders !== 1 ? 's' : ''} realizados`}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedCrew(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {loadingDetail ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Información General */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Estado</label>
                                            <p className="mt-1">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedCrew.state)}`}>
                                                    {getStateLabel(selectedCrew.state)}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Disponibilidad</label>
                                            <p className="mt-1">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getAvailabilityColor(selectedCrew.availability)}`}>
                                                    {getAvailabilityLabel(selectedCrew.availability)}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Miembros</label>
                                            <p className="mt-1 text-sm text-gray-900">{formatMembers(selectedCrew.members)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Progreso</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedCrew.progress}%</p>
                                        </div>
                                    </div>

                                    {/* Historial de Trabajos */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Trabajos</h3>
                                        {selectedCrew.workOrders && selectedCrew.workOrders.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedCrew.workOrders.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {order.titulo || order.serviceCategory}
                                                                    </h4>
                                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.state)}`}>
                                                                        {order.state}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1 text-sm text-gray-600">
                                                                    {order.client && (
                                                                        <p>
                                                                            <span className="font-medium">Cliente:</span>{' '}
                                                                            {order.client.nombreCompleto || order.client.razonSocial || 'N/A'}
                                                                        </p>
                                                                    )}
                                                                    {order.property && (
                                                                        <p>
                                                                            <span className="font-medium">Propiedad:</span>{' '}
                                                                            {order.property.alias || order.property.address || 'N/A'}
                                                                        </p>
                                                                    )}
                                                                    <p>
                                                                        <span className="font-medium">Dirección:</span> {order.address}
                                                                    </p>
                                                                    <p>
                                                                        <span className="font-medium">Creada:</span>{' '}
                                                                        {new Date(order.createdAt).toLocaleDateString('es-AR', {
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </p>
                                                                    {order.completedAt && (
                                                                        <p>
                                                                            <span className="font-medium">Finalizada:</span>{' '}
                                                                            {new Date(order.completedAt).toLocaleDateString('es-AR', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric',
                                                                            })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>Esta cuadrilla no tiene trabajos registrados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
