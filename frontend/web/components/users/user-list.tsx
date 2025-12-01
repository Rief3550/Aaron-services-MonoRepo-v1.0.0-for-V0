/**
 * User List Component
 * Presentation layer - Lista de usuarios usando DataTable reutilizable
 * Estructura replicable para otros CRUDs: cambiar tipos y columnas
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { fetchUsers, deleteUser, type User } from '@/lib/users/api';
import { formatRoleLabel } from '@/lib/auth/role-labels';

interface UserListProps {
  onEdit: (user: User) => void;
  refreshKey?: number;
}

export function UserList({ onEdit, refreshKey }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await deleteUser(id);
      await loadUsers(); // Recargar lista
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
    }
  };

  // Configuración de columnas para DataTable
  const columns: TableColumn<User>[] = [
    {
      key: 'fullName',
      label: 'Nombre Completo',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.fullName || 'N/A'}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => <span className="text-gray-600">{user.email}</span>,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: false,
      render: (user) => {
        const phone = user.phone || (user as any).telefono || (user as any).phoneNumber;
        return <span className="text-gray-600">{phone || '-'}</span>;
      },
    },
    {
      key: 'roles',
      label: 'Rol',
      sortable: false,
      align: 'center',
      render: (user) => {
        const roleNames =
          user.roles?.map((r) => formatRoleLabel(r.name)).join(', ') || 'Sin rol';
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {roleNames}
          </span>
        );
      },
    },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      align: 'center',
      render: (user) => (
        <StatusBadge
          state={user.active !== false ? 'ACTIVE' : 'INACTIVE'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      align: 'right',
      render: (user) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(user)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
            title="Editar usuario"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
              <path d="M12.379 5.207L4 13.586V16h2.414l8.379-8.379-2.414-2.414z" />
            </svg>
            <span className="sr-only">Editar</span>
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 text-sm font-medium"
            title="Eliminar usuario"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.366-.446.91-.699 1.484-.699h.518c.575 0 1.118.253 1.484.7l.263.321h3.494a.75.75 0 010 1.5h-.388l-.73 9.49a2 2 0 01-1.994 1.789H6.123a2 2 0 01-1.994-1.79l-.73-9.49h-.388a.75.75 0 010-1.5h3.494l.263-.321zm-2.11 2.821l.68 8.85a.5.5 0 00.498.45h6.945a.5.5 0 00.499-.45l.68-8.85H6.147z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">Eliminar</span>
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-800">{error}</p>
        <Button
          text="Reintentar"
          onClick={loadUsers}
          variant="secondary"
          size="sm"
          className="mt-2"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <DataTable
        data={users}
        columns={columns}
        itemsPerPage={10}
        isLoading={loading}
        emptyMessage="No hay usuarios registrados"
      />
    </div>
  );
}
