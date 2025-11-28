/**
 * Orders Status Chart Component
 * Presentation layer - Gráfico de líneas mejorado para estados de órdenes
 * Adaptado desde diseño de referencia, manteniendo estructura pero con colores de Aaron
 */

'use client';

import React, { useEffect, useState } from 'react';
import { opsApi } from '@/lib/api/services';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, ChartData, Chart, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    Filler
);

interface SeriesData {
    periodo: string;
    pendiente: number;
    en_curso: number;
    finalizado: number;
    cancelado: number;
}

const TIME_PERIODS = [
    { value: 'day' as const, label: 'Día' },
    { value: 'month' as const, label: 'Mes' },
    { value: 'year' as const, label: 'Año' },
] as const;

export const OrdersStatusChart: React.FC = () => {
    const [series, setSeries] = useState<SeriesData[]>([]);
    const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [yAxisRange, setYAxisRange] = useState({ min: 0, max: 50 });

    const fetchSeries = async (gb: typeof groupBy) => {
        try {
            setLoading(true);
            setError(null);
            const res = await opsApi.get<SeriesData[]>(`/metrics/operator/orders-by-status-series?groupBy=${gb}`);
            if (res.success && res.data && res.data.length > 0) {
                setSeries(res.data);
                
                // Calcular rango Y dinámico
                const allValues = res.data.flatMap(d => [
                    d.pendiente,
                    d.en_curso,
                    d.finalizado,
                    d.cancelado,
                ]);
                if (allValues.length > 0) {
                    const minValue = Math.min(...allValues);
                    const maxValue = Math.max(...allValues);
                    setYAxisRange({
                        min: Math.max(0, minValue - 2),
                        max: maxValue + 3,
                    });
                }
            } else {
                // No hay datos - mostrar estado vacío
                setSeries([]);
                setYAxisRange({ min: 0, max: 10 });
            }
        } catch (e) {
            console.error('Error fetching orders status series', e);
            setError('Error al cargar datos del gráfico');
            setSeries([]);
            setYAxisRange({ min: 0, max: 10 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeries(groupBy);
    }, [groupBy]);

    // Colores adaptados para Aaron (no copiados del diseño de referencia)
    const getDatasetConfig = (label: string, values: number[], colorConfig: {
        border: string;
        bgStart: string;
        bgEnd: string;
        point: string;
    }) => ({
        label,
        data: values,
        borderColor: colorConfig.border,
        backgroundColor: (context: { chart: Chart }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
            gradient.addColorStop(0, colorConfig.bgStart);
            gradient.addColorStop(1, colorConfig.bgEnd);
            return gradient;
        },
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: colorConfig.point, // Círculo lleno con el color de la línea
        pointBorderColor: colorConfig.point,
        pointBorderWidth: 0, // Sin borde en los puntos del gráfico
        pointHoverRadius: 7,
        pointHoverBackgroundColor: colorConfig.point,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
    });

    // Formatear labels según el periodo seleccionado
    const formatLabel = (periodo: string, gb: typeof groupBy): string => {
        if (gb === 'day') {
            // Ya viene formateado como "Lun", "Mar", etc. o como fecha
            return periodo;
        } else if (gb === 'month') {
            // Formatear como "Ene 2024", "Feb 2024", etc.
            if (periodo.includes('-')) {
                const [year, month] = periodo.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const monthIndex = parseInt(month) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    return `${monthNames[monthIndex]} ${year}`;
                }
            }
            return periodo;
        } else if (gb === 'year') {
            // Mostrar solo el año
            return periodo;
        }
        return periodo;
    };

    const labels = series.map((s) => formatLabel(s.periodo, groupBy));
    
    const chartData: ChartData<'line'> = {
        labels,
        datasets: [
            getDatasetConfig(
                'Pendiente',
                series.map((s) => s.pendiente),
                {
                    border: '#eab308', // Yellow-500 de Aaron
                    bgStart: 'rgba(234, 179, 8, 0.4)',
                    bgEnd: 'rgba(234, 179, 8, 0)',
                    point: '#eab308',
                }
            ),
            getDatasetConfig(
                'En curso',
                series.map((s) => s.en_curso),
                {
                    border: '#3b82f6', // Blue-500 de Aaron
                    bgStart: 'rgba(59, 130, 246, 0.4)',
                    bgEnd: 'rgba(59, 130, 246, 0)',
                    point: '#3b82f6',
                }
            ),
            getDatasetConfig(
                'Finalizado',
                series.map((s) => s.finalizado),
                {
                    border: '#10b981', // Emerald-500 de Aaron
                    bgStart: 'rgba(16, 185, 129, 0.4)',
                    bgEnd: 'rgba(16, 185, 129, 0)',
                    point: '#10b981',
                }
            ),
            getDatasetConfig(
                'Cancelado',
                series.map((s) => s.cancelado),
                {
                    border: '#ef4444', // Red-500 de Aaron
                    bgStart: 'rgba(239, 68, 68, 0.4)',
                    bgEnd: 'rgba(239, 68, 68, 0)',
                    point: '#ef4444',
                }
            ),
        ],
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 40, bottom: 40, left: 0, right: 10 } }, // Más padding vertical para expandir el área del gráfico
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 15,
                    font: {
                        size: 12,
                        weight: 500,
                    },
                    color: '#374151',
                    // Círculos más pequeños y llenos (sin borde)
                    boxWidth: 8,
                    boxHeight: 8,
                },
            },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    title: (tooltipItems: TooltipItem<'line'>[]) => {
                        const idx = tooltipItems[0].dataIndex;
                        return chartData.labels?.[idx]?.toString() ?? '';
                    },
                    label: (tooltipItem: TooltipItem<'line'>) => 
                        `${tooltipItem.dataset.label}: ${tooltipItem.raw} órdenes`,
                },
            },
            datalabels: {
                display: true,
                color: '#374151',
                align: 'top',
                anchor: 'end',
                offset: 4,
                font: { size: 11, weight: 500 },
                formatter: (value: number) => (value > 0 ? `${value}` : ''),
            },
        },
        scales: {
            x: {
                display: true,
                grid: { display: false },
                ticks: {
                    font: { size: 11 },
                    color: '#6b7280',
                    // Los labels ya vienen formateados desde formatLabel
                    maxRotation: groupBy === 'month' ? 45 : 0,
                    minRotation: groupBy === 'month' ? 45 : 0,
                },
                border: { display: false }, // Quitar borde del eje X
            },
            y: {
                display: false, // Quitar eje vertical completamente
                grid: {
                    display: false, // Quitar líneas horizontales guías
                },
                beginAtZero: true,
                border: { display: false }, // Quitar borde del eje Y
                min: yAxisRange.min,
                max: yAxisRange.max,
            },
        },
        interaction: {
            mode: 'nearest',
            intersect: false,
            axis: 'x',
        },
    };

    const renderSkeleton = () => (
        <div className="p-6 h-full">
            <div className="w-full h-full relative">
                <div className="absolute inset-0 flex flex-col justify-between opacity-20">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-px bg-gray-200" />
                    ))}
                </div>
                
                <div className="absolute inset-0 flex items-end">
                    <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center space-y-2">
                                    <div className="w-6 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                        
                        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                            <path
                                d="M 40 120 Q 80 80 120 100 Q 160 120 200 90 Q 240 60 280 110 Q 320 140 360 130"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                                fill="none"
                                className="animate-pulse"
                            />
                            <path
                                d="M 40 120 Q 80 80 120 100 Q 160 120 200 90 Q 240 60 280 110 Q 320 140 360 130 L 360 200 L 40 200 Z"
                                fill="url(#gradient)"
                                opacity="0.3"
                                className="animate-pulse"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#e5e7eb" />
                                    <stop offset="100%" stopColor="#f3f4f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTimeFilterButtons = () => (
        <div className="flex gap-1">
            {TIME_PERIODS.map((period) => (
                <button
                    key={period.value}
                    onClick={() => setGroupBy(period.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        groupBy === period.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );

    const renderChartContent = () => {
        if (loading) return renderSkeleton();
        
        if (error) {
            return (
                <div className="flex items-center justify-center h-full text-red-500">
                    <p className="text-sm">{error}</p>
                </div>
            );
        }

        if (series.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">No hay datos disponibles</p>
                </div>
            );
        }

        return <Line data={chartData} options={chartOptions} />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm flex flex-col h-full w-full">
            <div className="flex flex-col flex-grow">
                <div className="bg-white px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-900">Órdenes por Estado</h2>
                        {renderTimeFilterButtons()}
                    </div>
                </div>
                <div className="relative flex-grow w-full" style={{ minHeight: '500px' }}>
                    <div className="p-4 h-full">
                        <div className="w-full" style={{ height: '600px' }}>
                            {renderChartContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
