/**
 * Página de Configuración
 * Presentation layer - Configuración del sistema (solo ADMIN)
 */

'use client';

import { useAuth } from '@/lib/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConfiguracionPage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasRole('ADMIN')) {
      router.push('/dashboard');
    }
  }, [hasRole, router]);

  if (!hasRole('ADMIN')) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configuración general del sistema
        </p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <p className="text-gray-600">Opciones de configuración...</p>
        </div>
      </div>
    </div>
  );
}


