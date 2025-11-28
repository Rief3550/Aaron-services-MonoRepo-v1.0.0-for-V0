/**
 * Helper para crear middleware de roles
 * Uso: app.use('/admin', requireRoles('ADMIN'))
 */
export declare function requireRoles(...roles: string[]): (req: import("..").AuthRequest, res: Response, next: NextFunction) => any;
/**
 * Alias más corto
 */
export declare const Roles: typeof requireRoles;
//# sourceMappingURL=roles.decorator.d.ts.map