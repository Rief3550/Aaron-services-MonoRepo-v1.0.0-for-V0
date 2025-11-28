/**
 * Tipos compartidos para autenticación
 */

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface SignupResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isEmailVerified: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

