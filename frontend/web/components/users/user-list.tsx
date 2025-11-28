/**
 * User List Component
 * Presentation layer - Lista de usuarios usando DataTable reutilizable
 * Estructura replicable para otros CRUDs: cambiar tipos y columnas
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { fetchUsers, deleteUser, fetchRoles, type User } from '@/lib/users/api';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';

interface UserListProps {
  onEdit: (user: User) => void;
  onRefresh?: () => void;
}

export function UserList({ onEdit, onRefresh }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
      render: (user) => <span className="text-gray-600">{user.phone || '-'}</span>,
    },
    {
      key: 'roles',
      label: 'Rol',
      sortable: false,
      align: 'center',
      render: (user) => {
        const roleNames = user.roles?.map((r) => r.name).join(', ') || 'Sin rol';
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
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
          >
            Eliminar
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

