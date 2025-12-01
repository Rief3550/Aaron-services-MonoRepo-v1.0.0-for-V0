/**
 * Plans Management Page
 * Presentation layer - Página principal de gestión de planes
 * Estructura replicable desde usuarios
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PlanList } from '@/components/plans/plan-list';
import { PlanForm } from '@/components/plans/plan-form';
import { Button } from '@/components/ui/button';
import type { Plan } from '@/lib/plans/types';

// Iconos SVG inline
const PlansIcon = () => (
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

export default function AdminPlansPage() {
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole('ADMIN'))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

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
    setSelectedPlan(undefined);
    setShowForm(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedPlan(undefined);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedPlan(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PlansIcon />
            Gestión de Planes
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra los planes de suscripción del sistema
          </p>
        </div>
        {!showForm && (
          <Button
            text="Nuevo Plan"
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
            {selectedPlan ? 'Editar Plan' : 'Nuevo Plan'}
          </h2>
          <PlanForm
            plan={selectedPlan}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <PlanList
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
