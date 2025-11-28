/**
 * Helper para obtener usuario actual - Reutilizable por servicios Express
 */
import { AuthRequest } from '../guards/jwt-auth.guard.base';

/**
 * Obtiene el usuario actual del request
 */
export function getCurrentUser(req: AuthRequest) {
  return req.user || null;
}

/**
 * Obtiene el userId del request (lanza error si no está autenticado)
 */
export function getCurrentUserId(req: AuthRequest): string {
  if (!req.user || !req.user.userId) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
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
  return roles.some((role) => (req.user?.roles || []).includes(role));
}

