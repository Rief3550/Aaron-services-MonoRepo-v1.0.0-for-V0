'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';

// Placeholder for charts/metrics
function KpiCard({ title, value, change }: { title: string; value: string; change?: string }) {
    return (
        <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-semibold text-gray-900">{value}</span>
                {change && (
                    <span className="ml-2 text-sm font-medium text-green-600">
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { user, hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar que sea ADMIN
        if (!authLoading && (!isAuthenticated || !hasRole('ADMIN'))) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, hasRole, authLoading, router]);

    useEffect(() => {
        // Fetch metrics from backend
        // For now, mock data or fetch if API client is ready
        // const fetchMetrics = async () => { ... }
        // fetchMetrics();
        setLoading(false);
    }, []);

    if (authLoading || loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-gray-600">Cargando...</div>
            </div>
        );
    }

    if (!isAuthenticated || !hasRole('ADMIN')) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <div className="text-sm text-gray-500">
                    Bienvenido, {user?.fullName || 'Admin'}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Suscriptores Totales" value="1,234" change="+12%" />
                <KpiCard title="Ingresos (Mes)" value="$4.5M" change="+8%" />
                <KpiCard title="Altas (Mes)" value="45" change="+5%" />
                <KpiCard title="Bajas (Mes)" value="12" change="-2%" />
            </div>

            {/* Charts Section - Placeholder */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Altas vs Bajas</h3>
                    <div className="flex h-64 items-center justify-center bg-gray-50 text-gray-400">
                        [Gráfico de Líneas]
                    </div>
                </div>
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Suscripciones por Plan</h3>
                    <div className="flex h-64 items-center justify-center bg-gray-50 text-gray-400">
                        [Gráfico de Donut]
                    </div>
                </div>
            </div>

            {/* Financial/Debt Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Ingresos vs Vencimientos</h3>
                    <div className="flex h-64 items-center justify-center bg-gray-50 text-gray-400">
                        [Gráfico de Barras]
                    </div>
                </div>
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Suscripciones Vencidas</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Días</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {/* Mock rows */}
                                <tr>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Juan Perez</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">$15,000</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">5</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900">Gestionar</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
