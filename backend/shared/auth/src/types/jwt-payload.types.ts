/**
 * Types for JwtPayload
 */
export interface JwtPayload {
  userId?: string;
  sub?: string; // Also can come as 'sub'
  email?: string;
  roles?: string[];
  type?: string; // 'access' | 'refresh'
  iat?: number;
  exp?: number;
  [key: string]: any;
}

