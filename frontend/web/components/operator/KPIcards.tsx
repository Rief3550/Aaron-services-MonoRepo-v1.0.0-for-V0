/**
 * KPI Cards Component
 * Presentation layer - Tarjetas de KPIs mejoradas para el dashboard operativo
 * Adaptado desde diseño de referencia, manteniendo funcionalidad pero mejorando visualmente
 */

'use client';

import React, { useEffect, useState } from 'react';
import { opsApi } from '@/lib/api/services';

interface Summary {
    reclamosTotales: number;
    incidentesHoy: number; // Valor específico para hoy
    visitasHoy: number; // Valor específico para hoy
    ordenesPorEstado: Record<string, number>;
    incidentesDiarios?: { fecha: string; cantidad: number }[]; // Para gráficos (opcional)
    visitasDiarias?: { fecha: string; cantidad: number }[]; // Para gráficos (opcional)
}

// Iconos SVG inline (sin dependencias externas)
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Componente de Skeleton
const KPICardSkeleton = () => (
  <div className="flex flex-col p-4 rounded-xl shadow-lg bg-gray-50 animate-pulse" style={{ minHeight: '135px' }}>
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
      <div className="flex flex-col flex-1">
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export const KPIcards: React.FC = () => {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // Intentar cargar datos reales desde el backend
                console.log('[KPIcards] Intentando obtener datos reales del endpoint /metrics/operator/summary');
                const res = await opsApi.get<Summary>('/metrics/operator/summary');
                
                // El backend puede retornar directamente los datos o en formato { success, data }
                const data = res.data || res;
                
                if (res.success && data && (typeof data === 'object' && 'reclamosTotales' in data)) {
                    // Usar datos reales SIEMPRE, incluso si son cero (la base de datos puede estar vacía)
                    console.log('[KPIcards] ✅ Datos reales obtenidos del backend:', data);
                    
                    // Asegurar que los valores numéricos existan (si no, usar 0)
                    const realData: Summary = {
                        reclamosTotales: data.reclamosTotales ?? 0,
                        incidentesHoy: data.incidentesHoy ?? 0,
                        visitasHoy: data.visitasHoy ?? 0,
                        ordenesPorEstado: data.ordenesPorEstado ?? {},
                        incidentesDiarios: data.incidentesDiarios ?? [],
                        visitasDiarias: data.visitasDiarias ?? [],
                    };
                    
                    setSummary(realData);
                } else {
                    // Si la respuesta no tiene success o data, mostrar error pero NO usar mock
                    console.error('[KPIcards] ❌ Respuesta del endpoint no tiene datos válidos');
                    // Mostrar ceros en lugar de datos mock
                    setSummary({
                        reclamosTotales: 0,
                        incidentesHoy: 0,
                        visitasHoy: 0,
                        ordenesPorEstado: {},
                    });
                }
            } catch (e) {
                console.error('[KPIcards] ❌ Error al obtener datos del backend:', e);
                // En caso de error, mostrar ceros (NO datos mock)
                setSummary({
                    reclamosTotales: 0,
                    incidentesHoy: 0,
                    visitasHoy: 0,
                    ordenesPorEstado: {},
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <KPICardSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Usar valores directos del backend (ya calculados para HOY)
    // Si no hay summary, usar valores por defecto (0) - NUNCA ocultar las cards
    const safeSummary: Summary = summary || {
        reclamosTotales: 0,
        incidentesHoy: 0,
        visitasHoy: 0,
        ordenesPorEstado: {},
    };

    // Helper para formatear valores: siempre mostrar 0 si es null/undefined, nunca mostrar '-'
    const formatValue = (val: number | null | undefined): string => {
        // Si el valor es null o undefined, mostrar 0
        // Si el valor es 0, también mostrar 0 (no es falsy, es un valor válido)
        if (val === null || val === undefined) {
            return '0';
        }
        return val.toString();
    };

    const { reclamosTotales, incidentesHoy, visitasHoy, ordenesPorEstado } = safeSummary;
    const enCurso = ordenesPorEstado['EN_PROGRESO'] ?? 0;

    // Configuración de cards con iconos y colores adaptados a Aaron
    // IMPORTANTE: Siempre mostrar las cards, incluso con valor 0
    const cards = [
        {
            title: 'Reclamos Totales',
            value: formatValue(reclamosTotales),
            icon: <DocumentIcon />,
            iconBgColor: 'bg-blue-500',
            cardBgColor: 'bg-white',
            borderColor: 'border-blue-100',
        },
        {
            title: 'Incidentes Hoy',
            value: formatValue(incidentesHoy),
            icon: <AlertIcon />,
            iconBgColor: 'bg-orange-500',
            cardBgColor: 'bg-white',
            borderColor: 'border-orange-100',
        },
        {
            title: 'Visitas Hoy',
            value: formatValue(visitasHoy),
            icon: <CheckIcon />,
            iconBgColor: 'bg-emerald-500',
            cardBgColor: 'bg-white',
            borderColor: 'border-emerald-100',
        },
        {
            title: 'Órdenes en Curso',
            value: formatValue(enCurso),
            icon: <CalendarIcon />,
            iconBgColor: 'bg-purple-500',
            cardBgColor: 'bg-white',
            borderColor: 'border-purple-100',
        },
    ];

    return (
        <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`
                        flex flex-col p-4 rounded-xl shadow-sm border
                        transition-all duration-300 hover:shadow-md hover:-translate-y-1
                        ${card.cardBgColor} ${card.borderColor}
                    `}
                    style={{ minHeight: '120px' }}
                >
                    <div className="flex items-center h-full">
                        {/* Icono en círculo */}
                        <div
                            className={`
                                flex items-center justify-center 
                                w-12 h-12 rounded-full p-2.5 mr-4 
                                ${card.iconBgColor} text-white shadow-sm
                                flex-shrink-0
                            `}
                        >
                            {card.icon}
                        </div>

                        {/* Contenido */}
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm text-gray-500 font-medium mb-0.5">
                                {card.title}
                            </span>
                            <span className="text-2xl font-bold text-gray-900">
                                {card.value}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
};
