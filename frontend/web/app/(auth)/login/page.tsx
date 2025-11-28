/**
 * Página de Login
 * Presentation layer - Página de inicio de sesión exclusiva para administradores
 */

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';
import { LoginForm, LoginFormData } from '@/components/auth/login-form';
import { Loader } from '@/components/ui/loader';

// Force dynamic rendering for this page (uses useSearchParams)
export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated, isLoading, error: authError } = useAuth();

  // Redirigir si ya está autenticado (después de que Zustand hidrate)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await signIn({
        email: data.email,
        password: data.password,
      });

      // Redirigir después del login exitoso
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    } catch {
      // Error ya manejado en el hook
    }
  };

  // Mostrar loading mientras Zustand rehidrata
  if (isLoading) {
    return (
      <div className="bg-white">
        <Loader message="Cargando..." size="lg" fullScreen />
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario (useEffect redirigirá)
  if (isAuthenticated) {
    return null;
  }

  return (
    <LoginForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={authError}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white">
          <Loader message="Cargando..." size="lg" fullScreen />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
