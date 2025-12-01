/**
 * Header Component
 * Presentation layer - Barra superior con información del usuario
 */

'use client';

import { useAuth } from '@/lib/auth/hooks/use-auth';
import { formatRolesList } from '@/lib/auth/role-labels';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Backoffice
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.fullName || user?.email || 'Usuario'}
              </div>
              <div className="text-xs text-gray-500">
                {formatRolesList(user?.roles || []) || 'Sin roles'}
              </div>
            </div>
            
            {/* Avatar placeholder */}
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}

