/**
 * Tipos de autenticación
 * Domain layer - Tipos del dominio de autenticación
 */

export interface User {
  id: string;
  email: string;
  fullName?: string;
  isEmailVerified: boolean;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'CREW' | 'CUSTOMER';


