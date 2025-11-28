/**
 * Base JWT Auth Guard - Reutilizable por todos los servicios
 * Para usar en servicios Express (no NestJS), importar y extender
 */
import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
    roles: string[];
    type?: string;
    [key: string]: any;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export declare class JwtAuthGuardBase {
    private publicRoutes;
    private secret;
    constructor(secret: string, publicRoutes?: string[]);
    /**
     * Middleware para Express
     */
    middleware(): (req: AuthRequest, _res: Response, next: NextFunction) => any;
    /**
     * Verificar token y retornar payload
     */
    verifyToken(token: string): JwtPayload;
}
//# sourceMappingURL=jwt-auth.guard.base.d.ts.map