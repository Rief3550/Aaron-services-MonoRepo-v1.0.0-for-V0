/**
 * WorkTypes Management Page
 * Presentation layer - Página principal de gestión de tipos de trabajo
 * Estructura replicable desde usuarios
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WorkTypeList } from '@/components/work-types/work-type-list';
import { WorkTypeForm } from '@/components/work-types/work-type-form';
import { Button } from '@/components/ui/button';
import type { WorkType } from '@/lib/work-types/types';

// Iconos SVG inline
const WorkTypesIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

export default function AdminWorkTypesPage() {
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | undefined>(undefined);
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
    setSelectedWorkType(undefined);
    setShowForm(true);
  };

  const handleEdit = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedWorkType(undefined);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedWorkType(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <WorkTypesIcon />
            Gestión de Tipos de Trabajo
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra los tipos de trabajo disponibles en el sistema
          </p>
        </div>
        {!showForm && (
          <Button
            text="Nuevo Tipo"
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
            {selectedWorkType ? 'Editar Tipo de Trabajo' : 'Nuevo Tipo de Trabajo'}
          </h2>
          <WorkTypeForm
            workType={selectedWorkType}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <WorkTypeList
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
