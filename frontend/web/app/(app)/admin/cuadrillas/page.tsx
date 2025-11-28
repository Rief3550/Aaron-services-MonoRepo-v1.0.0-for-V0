/**
 * Crews Management Page
 * Presentation layer - Página principal de gestión de cuadrillas
 * Estructura replicable desde usuarios
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CrewList } from '@/components/crews/crew-list';
import { CrewForm } from '@/components/crews/crew-form';
import { Button } from '@/components/ui/button';
import type { Crew } from '@/lib/crews/types';

// Iconos SVG inline
const CrewsIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

export default function CuadrillasPage() {
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | undefined>(undefined);
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
    setSelectedCrew(undefined);
    setShowForm(true);
  };

  const handleEdit = (crew: Crew) => {
    setSelectedCrew(crew);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedCrew(undefined);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedCrew(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CrewsIcon />
            Gestión de Cuadrillas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra las cuadrillas del sistema
          </p>
        </div>
        {!showForm && (
          <Button
            text="Nueva Cuadrilla"
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
            {selectedCrew ? 'Editar Cuadrilla' : 'Nueva Cuadrilla'}
          </h2>
          <CrewForm
            crew={selectedCrew}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <CrewList
          key={refreshKey}
          onEdit={handleEdit}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
