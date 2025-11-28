/**
 * Policies Guard - ABAC/Casbin
 * Valida políticas más complejas usando Casbin (opcional, para futuro)
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './jwt-auth.guard';
export interface Policy {
    subject: string;
    object: string;
    action: string;
}
export declare class PoliciesGuard {
    private policies;
    private casbinEnabled;
    constructor(policies?: Policy[]);
    /**
     * Habilitar Casbin (cuando se implemente)
     */
    enableCasbin(enabled?: boolean): this;
    /**
     * Middleware para Express
     */
    middleware(): (req: AuthRequest, _res: Response, next: NextFunction) => Promise<any>;
    /**
     * Factory para crear guard con política específica
     */
    static requirePolicy(subject: string, object: string, action: string): PoliciesGuard;
}
//# sourceMappingURL=policies.guard.d.ts.map