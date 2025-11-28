/**
 * Roles Decorator - Para usar en Express como helper
 * Define roles requeridos y crea un middleware
 */
import { RolesGuard } from '../guards/roles.guard';

/**
 * Helper para crear middleware de roles
 * Uso: app.use('/admin', requireRoles('ADMIN'))
 */
export function requireRoles(...roles: string[]) {
  return new RolesGuard(...roles).middleware();
}

/**
 * Alias más corto (Deprecated for NestJS usage, use requireRoles for Express)
 * Eliminado para evitar conflictos con el decorador de NestJS
 */
// export const Roles = requireRoles;

