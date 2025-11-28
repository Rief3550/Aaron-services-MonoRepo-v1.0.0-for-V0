/**
 * Hook de autenticación
 * Presentation layer - Hook para consumir el store de autenticación
 */

'use client';

import { useAuthStore } from '../auth.store';
import { authService } from '../auth.service';
import { SignInCredentials } from '../types';

export function useAuth() {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    _hasHydrated,
    setAuth,
    setLoading,
    setError,
    reset,
    hasRole,
    hasAnyRole,
  } = useAuthStore();

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.signIn(credentials);
      
      // Establecer auth de una sola vez para evitar race conditions
      setAuth(response.user, response.tokens);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
    } finally {
      reset();
    }
  };

  return {
    user,
    tokens,
    isAuthenticated,
    // Mostrar loading solo si no ha hidratado aún
    isLoading: !_hasHydrated || isLoading,
    error,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
  };
}

