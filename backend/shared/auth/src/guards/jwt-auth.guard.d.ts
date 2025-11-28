/**
 * JWT Auth Guard - Guard base reutilizable
 * Para servicios Express
 */
import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId?: string;
    sub?: string;
    email?: string;
    roles?: string[];
    type?: string;
    [key: string]: any;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export declare class JwtAuthGuard {
    private secret;
    private publicRoutes;
    constructor(secret: string, publicRoutes?: string[]);
    /**
     * Middleware para Express
     */
    middleware(): (req: AuthRequest, _res: Response, next: NextFunction) => any;
    /**
     * Verificar token y retornar payload
     */
    verifyToken(token: string): JwtPayload;
    /**
     * Verificar token desde query string (útil para WebSocket)
     */
    verifyTokenFromQuery(token?: string): JwtPayload | null;
}
//# sourceMappingURL=jwt-auth.guard.d.ts.map