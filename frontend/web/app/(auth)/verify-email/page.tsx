/**
 * Página de Verificación de Email
 * El usuario llega aquí desde el enlace del email
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/services';

// Force dynamic rendering for this page (uses useSearchParams)
export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    // Verificar el email
    const verifyEmail = async () => {
      try {
        // authApi ya tiene la base URL /auth, así que solo usamos /verify
        const response = await authApi.post('/verify', { token });
        
        if (response.success) {
          setStatus('success');
          setMessage('Email verificado exitosamente. Redirigiendo al login...');
          
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.error || 'Error al verificar el email');
        }
      } catch (error: any) {
        setStatus('error');
        const errorMessage = error?.response?.data?.error?.message || 
                            error?.message || 
                            'Error al verificar el email';
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Verificación de Email</h2>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          {status === 'loading' && (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600">Verificando tu email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-red-600">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Ir al Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

