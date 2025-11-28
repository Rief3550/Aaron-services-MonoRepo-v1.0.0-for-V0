/**
 * Store de autenticación
 * Presentation layer - Estado global de autenticación
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, AuthTokens } from './types';
import { authService } from './auth.service';

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuth: (user: User, tokens: AuthTokens) => void;
  reset: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state, isLoading: false });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setTokens: (tokens) => {
        set({ tokens });
      },

      // Método combinado para establecer auth después del login
      setAuth: (user, tokens) => {
        // Guardar tokens en localStorage para que ApiClient pueda leerlos
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => {
        // Limpiar tokens de localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ ...initialState, isLoading: false, _hasHydrated: true });
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.roles.includes(role) ?? false;
      },

      hasAnyRole: (roles: string[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.some((role) => user.roles.includes(role));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating auth state:', error);
          state?.setHasHydrated(true);
          return;
        }
        
        if (state) {
          // Validar token al rehidratar
          if (state.tokens?.accessToken && authService.validateToken(state.tokens.accessToken)) {
            // Token válido - sincronizar a localStorage para que ApiClient pueda leerlos
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', state.tokens.accessToken);
              localStorage.setItem('refreshToken', state.tokens.refreshToken);
            }
            state.setHasHydrated(true);
          } else {
            // Token inválido o expirado, limpiar estado
            state.reset();
          }
        }
      },
    }
  )
);

