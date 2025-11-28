/**
 * Página de Detalle de Orden de Trabajo (Client Component)
 * Presentation layer - Gestión detallada de una orden
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { opsApi } from '@/lib/api/services';

interface TimelineEvent {
    id: string;
    type: string;
    at: string;
    note?: string;
}

interface Crew {
    id: string;
    name: string;
    state: string;
}

interface WorkOrder {
    id: string;
    serviceCategory: string;
    state: string;
    address: string;
    description?: string;
    createdAt: string;
    crewId?: string;
    crew?: Crew;
    timeline: TimelineEvent[];
}

export default function OrderDetailClient() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [order, setOrder] = useState<WorkOrder | null>(null);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedCrewId, setSelectedCrewId] = useState('');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orderResult, crewsResult] = await Promise.all([
                opsApi.get<WorkOrder>(`/work-orders/${id}`),
                opsApi.get<Crew[]>('/crews')
            ]);

            if (orderResult.success && orderResult.data) {
                setOrder(orderResult.data);
                if (orderResult.data.crewId) {
                    setSelectedCrewId(orderResult.data.crewId);
                }
            }
            if (crewsResult.success && crewsResult.data) {
                setCrews(crewsResult.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignCrew = async () => {
        if (!selectedCrewId) return;
        try {
            setAssigning(true);
            const result = await opsApi.patch(`/work-orders/${id}/assign-crew/${selectedCrewId}`, {});
            if (result.success) {
                loadData(); // Reload to see updates
            }
        } catch (error) {
            console.error('Error assigning crew:', error);
        } finally {
            setAssigning(false);
        }
    };

    const handleChangeState = async (newState: string) => {
        try {
            const result = await opsApi.patch(`/work-orders/${id}/state`, { state: newState });
            if (result.success) {
                loadData();
            }
        } catch (error) {
            console.error('Error changing state:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!order) {
        return <div>Orden no encontrada</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Volver
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Orden #{order.id.slice(0, 8)}</h1>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Detalle y gestión</p>
                </div>
                <div className="flex gap-2">
                    {order.state === 'PENDIENTE' && (
                        <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800">
                            Pendiente de Asignación
                        </span>
                    )}
                    {order.state === 'PROGRAMADA' && (
                        <button
                            onClick={() => handleChangeState('EN_CAMINO')}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Marcar En Camino
                        </button>
                    )}
                    {order.state === 'EN_CAMINO' && (
                        <button
                            onClick={() => handleChangeState('EN_PROGRESO')}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Iniciar Trabajo
                        </button>
                    )}
                    {order.state === 'EN_PROGRESO' && (
                        <button
                            onClick={() => handleChangeState('FINALIZADA')}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            Finalizar Orden
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Información General</h2>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Servicio</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.serviceCategory}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Estado Actual</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.state}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.address}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.description || 'Sin descripción'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Línea de Tiempo</h2>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {order.timeline.map((event, eventIdx) => (
                                    <li key={event.id}>
                                        <div className="relative pb-8">
                                            {eventIdx !== order.timeline.length - 1 ? (
                                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 ring-8 ring-white">
                                                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            {event.type} <span className="font-medium text-gray-900">{event.note}</span>
                                                        </p>
                                                    </div>
                                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                        {new Date(event.at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Asignación</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cuadrilla</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={selectedCrewId}
                                    onChange={(e) => setSelectedCrewId(e.target.value)}
                                    disabled={order.state === 'FINALIZADA' || order.state === 'CANCELADA'}
                                >
                                    <option value="">Seleccionar Cuadrilla</option>
                                    {crews.map((crew) => (
                                        <option key={crew.id} value={crew.id}>
                                            {crew.name} ({crew.state})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAssignCrew}
                                disabled={!selectedCrewId || assigning || order.state === 'FINALIZADA' || order.state === 'CANCELADA'}
                                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                {assigning ? 'Asignando...' : 'Asignar / Reasignar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
