/**
 * Roles Guard - RBAC
 * Valida que el usuario tenga al menos uno de los roles requeridos
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './jwt-auth.guard';
export declare class RolesGuard {
    private allowedRoles;
    constructor(...allowedRoles: string[]);
    /**
     * Middleware para Express
     */
    middleware(): (req: AuthRequest, _res: Response, next: NextFunction) => any;
    /**
     * Factory para crear guard con roles específicos
     */
    static require(...roles: string[]): RolesGuard;
    /**
     * Verificar si usuario tiene rol
     */
    static hasRole(user: {
        roles?: string[];
    }, role: string): boolean;
    /**
     * Verificar si usuario tiene alguno de los roles
     */
    static hasAnyRole(user: {
        roles?: string[];
    }, roles: string[]): boolean;
    /**
     * Verificar si usuario tiene todos los roles
     */
    static hasAllRoles(user: {
        roles?: string[];
    }, roles: string[]): boolean;
}
//# sourceMappingURL=roles.guard.d.ts.map