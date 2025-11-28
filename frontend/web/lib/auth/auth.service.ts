/**
 * Servicio de autenticación
 * Domain layer - Lógica de negocio de autenticación
 */

import { AuthResponse, SignInCredentials, User, AuthTokens } from './types';
export type { AuthResponse, SignInCredentials, User, AuthTokens };
import { authApi } from '../api/services';

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface IAuthService {
  signIn(credentials: SignInCredentials): Promise<AuthResponse>;
  signUp(credentials: SignUpCredentials): Promise<AuthResponse>;
  signOut(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  getCurrentUser(): Promise<User | null>;
  validateToken(token: string): boolean;
}

class AuthService implements IAuthService {
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      // Extraer solo email y password para evitar enviar campos extra (rememberMe) que causen error 400
      // si el backend tiene forbidNonWhitelisted: true
      const { email, password } = credentials;
      
      // La base URL ya incluye '/auth', así que solo usamos '/signin'
      const result = await authApi.post<{ user: User; tokens: AuthTokens }>('/signin', { email, password });
      
      // El backend devuelve { success, data: { user, tokens } }
      if (result.success && result.data) {
        // TEMPORAL: El backend no está enviando roles en el JWT
        // Asignar roles basándose en el email hasta que se corrija el backend
        if (!result.data.user.roles || result.data.user.roles.length === 0) {
          console.warn('⚠️  Backend no devolvió roles. Asignando roles temporalmente basándose en email...');
          
          if (email.includes('admin')) {
            result.data.user.roles = ['ADMIN'];
          } else if (email.includes('operator')) {
            result.data.user.roles = ['OPERATOR'];
          } else if (email.includes('crew')) {
            result.data.user.roles = ['CREW'];
          } else {
            result.data.user.roles = ['CUSTOMER'];
          }
          
          console.log(`✅ Roles asignados temporalmente: ${result.data.user.roles.join(', ')}`);
        }
        
        return result.data;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
      throw new Error(errorMessage || 'Error al iniciar sesión');
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      // La base URL ya incluye '/auth', así que solo usamos '/signup'
      const result = await authApi.post<{ user: User; tokens: AuthTokens }>('/signup', credentials);
      
      // El backend devuelve { success, data: { user, tokens } }
      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cuenta';
      throw new Error(errorMessage || 'Error al crear cuenta');
    }
  }

  async signOut(): Promise<void> {
    try {
      await authApi.post('/signout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // This method is likely not needed anymore as cookies handle refresh
    // But keeping it for interface compatibility, returning empty tokens
    return { accessToken: '', refreshToken: '' };
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // We need to call the gateway directly for /users/me
      // The authApi base URL is /auth, so we strip it
      const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL?.replace('/auth', '') || 'http://localhost:3100';
      const url = `${baseUrl}/users/me`;
      
      const response = await fetch(url, {
        credentials: 'include', // Send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  validateToken(token: string): boolean {
    // We can't validate token client-side anymore as we can't read it
    // Validation happens on the server
    return true;
  }

  // Token management - No-ops for cookie-based auth
  saveTokens(tokens: AuthTokens): void {}

  getAccessToken(): string | null {
    return null;
  }

  getRefreshToken(): string | null {
    return null;
  }

  clearTokens(): void {}
}

export const authService = new AuthService();

