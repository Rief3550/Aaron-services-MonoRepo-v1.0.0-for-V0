/**
 * Decorator @CurrentUser - Obtiene el usuario actual del contexto
 * Para servicios Express (helper function, no decorator real)
 */

import { AuthRequest } from '../guards/jwt-auth.guard';

/**
 * Obtiene el usuario actual del request
 * Extrae sub/userId y roles del JWT
 */
export function getCurrentUser(req: AuthRequest) {
  return req.user || null;
}

/**
 * Helper para obtener el userId (sub) del request
 */
export function getCurrentUserId(req: AuthRequest): string {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  const userId = req.user.userId || req.user.sub;
  if (!userId) {
    throw new Error('User ID not found in token');
  }
  return userId;
}

/**
 * Obtiene los roles del usuario actual
 */
export function getCurrentUserRoles(req: AuthRequest): string[] {
  return req.user?.roles || [];
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(req: AuthRequest, role: string): boolean {
  return (req.user?.roles || []).includes(role);
}

/**
 * Verifica si el usuario tiene alguno de los roles
 */
export function hasAnyRole(req: AuthRequest, roles: string[]): boolean {
  return roles.some((role) => hasRole(req, role));
}

/**
 * Verifica si el usuario tiene todos los roles
 */
export function hasAllRoles(req: AuthRequest, roles: string[]): boolean {
  return roles.every((role) => hasRole(req, role));
}
