'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchClientById, type Client } from '@/lib/clients/api';
import { UpdateAddressForm } from '@/components/clients/UpdateAddressForm';

// Componente de Card de Detalle
const DetailCard = ({ title, icon, children, className = '' }: any) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            {icon}
            <h3>{title}</h3>
        </div>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value, valueClass = 'text-gray-900' }: any) => (
    <div className="flex justify-between items-start text-sm">
        <span className="text-gray-500">{label}:</span>
        <span className={`font-medium text-right ${valueClass}`}>{value}</span>
    </div>
);

export default function ClienteDetallePage() {
    const params = useParams();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadClient = async () => {
            const id = params.id as string;
            if (!id) {
                setError('ID de cliente no proporcionado');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const clientData = await fetchClientById(id);
                setClient(clientData);
            } catch (err) {
                console.error('Error loading client:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar datos del cliente');
            } finally {
                setLoading(false);
            }
        };

        loadClient();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-600">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error || 'Cliente no encontrado'}</p>
                </div>
            </div>
        );
    }

    // Obtener datos formateados
    const clientName = client.nombreCompleto || client.razonSocial || 'Sin nombre';
    const clientEmail = client.email || '-';
    const clientPhone = client.telefono || '-';
    const clientStatus = client.estado || 'Desconocido';
    const joinDate = client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-';
    
    // Obtener suscripción activa
    const activeSubscription = client.subscriptions?.find(s => s.estado === 'ACTIVA') || client.subscriptions?.[0];
    const subscriptionPlan = activeSubscription?.plan?.nombre || 'Sin plan';
    const subscriptionStatus = activeSubscription?.estado || 'Sin estado';
    const subscriptionPrice = activeSubscription?.plan?.precio 
        ? `$${activeSubscription.plan.precio.toLocaleString()}` 
        : '-';
    const nextBilling = activeSubscription?.proximoCobro 
        ? new Date(activeSubscription.proximoCobro).toLocaleDateString() 
        : '-';

    // Obtener primera propiedad
    const firstProperty = client.properties?.[0];
    const propertyAddress = firstProperty?.address || firstProperty?.alias || '-';

    // Obtener historial de trabajos
    const workHistory = client.workOrders || []; 

    return (
        <div className="space-y-6">
            {/* Header del Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl">
                        {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{clientName}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {clientEmail}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {clientPhone}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        {clientStatus}
                    </span>
                    <span className="text-xs text-gray-400">Cliente desde {joinDate}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna Izquierda: Detalles (Sticky) */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Suscripción */}
                    <DetailCard 
                        title="Suscripción Actual" 
                        icon={
                            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        }
                    >
                        <InfoRow label="Plan" value={subscriptionPlan} valueClass="text-purple-700 font-bold" />
                        <InfoRow label="Estado" value={subscriptionStatus} valueClass="text-green-600" />
                        <InfoRow label="Precio" value={subscriptionPrice} />
                        <InfoRow label="Próximo Cobro" value={nextBilling} />
                    </DetailCard>

                    {/* Contrato */}
                    <DetailCard 
                        title="Datos de Contrato" 
                        icon={
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                    >
                        <InfoRow label="Dirección Principal" value={propertyAddress} />
                        <InfoRow label="Propiedades" value={client.properties?.length || 0} />
                        <InfoRow label="Suscripciones" value={client.subscriptions?.length || 0} />
                        <InfoRow label="Trabajos Realizados" value={workHistory.length} />
                    </DetailCard>

                    {/* Auditoría Inmueble */}
                    <DetailCard 
                        title="Estado Inmueble (Auditoría)" 
                        icon={
                            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        <InfoRow label="Propiedades" value={client.properties?.length || 0} />
                        {firstProperty && (
                            <>
                                <InfoRow label="Dirección" value={firstProperty.address || firstProperty.alias || '-'} />
                                <InfoRow label="Alias" value={firstProperty.alias || '-'} />
                            </>
                        )}
                    </DetailCard>

                    {/* Actualizar Domicilio */}
                    <DetailCard 
                        title="Actualizar Domicilio" 
                        icon={
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                    >
                        <UpdateAddressForm
                            clientId={client.id}
                            currentAddress={{
                                calle: client.calle,
                                numero: client.numero,
                                piso: client.piso,
                                departamento: client.departamento,
                                localidad: client.localidad,
                                provincia: client.provincia,
                                codigoPostal: client.codigoPostal,
                            }}
                            onSuccess={() => {
                                // Recargar datos del cliente
                                window.location.reload();
                            }}
                        />
                    </DetailCard>
                </div>

                {/* Columna Derecha: Historial de Trabajos (Más ancha) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Historial de Trabajos</h2>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                + Nuevo Trabajo
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo / Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuadrilla</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {workHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No hay trabajos registrados para este cliente
                                            </td>
                                        </tr>
                                    ) : (
                                        workHistory.map((job) => (
                                            <tr key={job.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">#{job.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {job.workType?.nombre || 'Sin tipo'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {job.property?.address || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {job.crew?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        {job.state || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



