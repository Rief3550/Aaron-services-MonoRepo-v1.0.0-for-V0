/**
 * Users Management Page
 * Presentation layer - Página principal de gestión de usuarios
 * Estructura replicable para otros CRUDs: cambiar tipos y componentes
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserList } from '@/components/users/user-list';
import { UserForm } from '@/components/users/user-form';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/users/types';

// Iconos SVG inline (sin dependencias externas)
const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

export default function UsuariosPage() {
  const { hasRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
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
    setSelectedUser(undefined);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedUser(undefined);
    setRefreshKey((prev) => prev + 1); // Forzar recarga de lista
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedUser(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon />
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra los usuarios del sistema
          </p>
        </div>
        {!showForm && (
          <Button
            text="Nuevo Usuario"
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
            {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <UserForm
            user={selectedUser}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <UserList
          key={refreshKey}
          onEdit={handleEdit}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
