/**
 * Decorator @CurrentUser - Obtiene el usuario actual del contexto
 * Para servicios Express (helper function, no decorator real)
 */
import { AuthRequest } from '../guards/jwt-auth.guard';
/**
 * Obtiene el usuario actual del request
 * Extrae sub/userId y roles del JWT
 */
export declare function getCurrentUser(req: AuthRequest): import("../guards/jwt-auth.guard").JwtPayload | null;
/**
 * Helper para obtener el userId (sub) del request
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
/**
 * Verifica si el usuario tiene todos los roles
 */
export declare function hasAllRoles(req: AuthRequest, roles: string[]): boolean;
//# sourceMappingURL=current-user.decorator.d.ts.map