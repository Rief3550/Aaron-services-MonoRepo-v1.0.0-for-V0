/**
 * Layout para la aplicación interna
 * Presentation layer - Layout con sidebar y header para el backoffice
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader } from '@/components/ui/loader';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si terminó de cargar Y no está autenticado
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostrar loading mientras Zustand rehidrata el estado
  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <Loader message="Verificando sesión..." size="lg" fullScreen />
      </div>
    );
  }

  // Si no está autenticado después de cargar, no renderizar nada (useEffect redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="ml-64 flex h-full flex-col">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

