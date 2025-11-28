/**
 * Helper para obtener usuario actual - Reutilizable por servicios Express
 */
import { AuthRequest } from '../guards/jwt-auth.guard.base';
/**
 * Obtiene el usuario actual del request
 */
export declare function getCurrentUser(req: AuthRequest): import("../guards/jwt-auth.guard.base").JwtPayload | null;
/**
 * Obtiene el userId del request (lanza error si no está autenticado)
 */
export declare function getCurrentUserId(req: AuthRequest): string;
/**
 * Obtiene los roles del usuario actual
 */
export declare function getCurrentUserRoles(req: AuthRequest): string[];
/**
 * Verifica si el usuario tiene un rol específico
 */
export declare function hasRole(req: AuthRequest, role: string): boolean;
/**
 * Verifica si el usuario tiene alguno de los roles
 */
export declare function hasAnyRole(req: AuthRequest, roles: string[]): boolean;
//# sourceMappingURL=current-user.helper.d.ts.map