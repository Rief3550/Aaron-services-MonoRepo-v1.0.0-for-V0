/**
 * Página de Mapa de Operaciones
 * Presentation layer - Visualización de propiedades y cuadrillas en mapa
 */

'use client';

import { useEffect, useState } from 'react';
import { GoogleMap } from '@/components/map/google-map';
import { MapMarker } from '@/lib/types/map.types';
import { opsApi } from '@/lib/api/services';

export default function MapPage() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        try {
            setLoading(true);
            // Fetch properties
            const propsResult = await opsApi.get<any[]>('/properties');

            if (propsResult.success && propsResult.data) {
                const newMarkers: MapMarker[] = propsResult.data
                    .filter(p => p.lat && p.lng)
                    .map(p => ({
                        id: p.id,
                        type: 'client' as const,
                        position: {
                            lat: p.lat,
                            lng: p.lng,
                        },
                        title: p.address,
                        description: `Estado: ${p.status}`,
                        clientId: p.userId || p.id,
                        clientName: p.address,
                        status: p.status === 'ACTIVE' ? 'active' : 'pending',
                    } as MapMarker));

                setMarkers(newMarkers);
            }
        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerClick = (marker: MapMarker) => {
        setSelectedMarker(marker);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mapa de Operaciones</h1>
                    <p className="mt-1 text-sm text-gray-600">Visualización en tiempo real de propiedades y cuadrillas</p>
                </div>
                <button
                    onClick={loadMapData}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Actualizar
                </button>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
                {loading ? (
                    <div className="flex h-[600px] items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <GoogleMap
                        center={{ lat: -34.6037, lng: -58.3816 }} // Default to BA
                        zoom={12}
                        height="600px"
                        className="w-full"
                        markers={markers}
                        onMarkerClick={handleMarkerClick}
                    />
                )}
            </div>

            {selectedMarker && (
                <div className="fixed bottom-6 right-6 w-80 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">{selectedMarker.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{selectedMarker.description}</p>
                        </div>
                        <button
                            onClick={() => setSelectedMarker(null)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                            Ver Detalle
                        </button>
                        <button className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            Crear Orden
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
