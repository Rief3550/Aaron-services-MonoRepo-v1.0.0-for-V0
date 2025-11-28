/**
 * Subscriptions Management Page
 * Presentation layer - Página principal de gestión de suscripciones
 * Estructura replicable desde usuarios
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { BudgetCardGrid, type SubscriptionState } from '@/components/ui/budget-card';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { Button } from '@/components/ui/button';
import { fetchSubscriptions, type Subscription } from '@/lib/subscriptions/service';

// Iconos SVG inline
const SubscriptionsIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

export default function AdminSubscriptionsPage() {
    const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>(undefined);
    const [refreshKey, setRefreshKey] = useState(0);
    const [subscriptionStats, setSubscriptionStats] = useState<Record<SubscriptionState, number>>({
        ACTIVE: 0,
        PAST_DUE: 0,
        SUSPENDED: 0,
        CANCELLED: 0,
    });
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !hasRole('ADMIN'))) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, hasRole, authLoading, router]);

    const loadStats = async () => {
        try {
            const subscriptions = await fetchSubscriptions();
            const stats: Record<SubscriptionState, number> = {
                ACTIVE: subscriptions.filter(s => s.status === 'ACTIVE').length,
                PAST_DUE: subscriptions.filter(s => s.status === 'PAST_DUE').length,
                SUSPENDED: subscriptions.filter(s => s.status === 'SUSPENDED' || s.status === 'PAUSED').length,
                CANCELLED: subscriptions.filter(s => s.status === 'CANCELED').length,
            };
            setSubscriptionStats(stats);
        } catch (error) {
            console.error('Error loading subscription stats:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && hasRole('ADMIN')) {
            loadStats();
        }
    }, [isAuthenticated, hasRole]);

    if (authLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-gray-600">Cargando...</div>
            </div>
        );
    }

    if (!isAuthenticated || !hasRole('ADMIN')) {
        return null;
    }

    const handleAdd = () => {
        setSelectedSubscription(undefined);
        setShowForm(true);
    };

    const handleEdit = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setShowForm(true);
    };

    const handleSuccess = () => {
        setShowForm(false);
        setSelectedSubscription(undefined);
        setRefreshKey((prev) => prev + 1);
        loadStats();
    };

    const handleCancel = () => {
        setShowForm(false);
        setSelectedSubscription(undefined);
    };

    const handleBudgetClick = (status: SubscriptionState) => {
        setStatusFilter(status === 'CANCELLED' ? 'CANCELED' : status);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <SubscriptionsIcon />
                        Gestión de Suscripciones
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Administra las suscripciones del sistema
                    </p>
                </div>
                {!showForm && (
                    <Button
                        text="Nueva Suscripción"
                        onClick={handleAdd}
                        icon={<PlusIcon />}
                        variant="primary"
                    />
                )}
                {showForm && (
                    <Button
                        text="Volver"
                        onClick={handleCancel}
                        icon={<ArrowLeftIcon />}
                        variant="secondary"
                    />
                )}
            </div>

            {/* Content */}
            {showForm ? (
                <div className="rounded-lg bg-white shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {selectedSubscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
                    </h2>
                    <SubscriptionForm
                        subscription={selectedSubscription}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            ) : (
                <>
                    {/* Budget Cards - Estados de Suscripciones */}
                    <BudgetCardGrid
                        budgets={[
                            {
                                state: 'ACTIVE',
                                count: subscriptionStats.ACTIVE,
                                onClick: () => handleBudgetClick('ACTIVE'),
                            },
                            {
                                state: 'PAST_DUE',
                                count: subscriptionStats.PAST_DUE,
                                onClick: () => handleBudgetClick('PAST_DUE'),
                            },
                            {
                                state: 'SUSPENDED',
                                count: subscriptionStats.SUSPENDED,
                                onClick: () => handleBudgetClick('SUSPENDED'),
                            },
                            {
                                state: 'CANCELLED',
                                count: subscriptionStats.CANCELLED,
                                onClick: () => handleBudgetClick('CANCELLED'),
                            },
                        ]}
                        context="subscriptions"
                    />

                    <SubscriptionList
                        key={refreshKey}
                        onEdit={handleEdit}
                        onRefresh={() => {
                            setRefreshKey((prev) => prev + 1);
                            loadStats();
                        }}
                        filters={statusFilter ? { status: statusFilter } : undefined}
                    />
                </>
            )}
        </div>
    );
}
