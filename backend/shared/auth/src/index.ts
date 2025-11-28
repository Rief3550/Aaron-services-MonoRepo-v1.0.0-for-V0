/**
 * @aaron/auth - Biblioteca de autenticación y autorización
 * 
 * Exporta: guards, decorators (@CurrentUser, @Roles), helpers de Casbin/RBAC
 */

// Export guards (includes JwtPayload, AuthRequest interfaces)
export * from './guards';

// Export decorators
export * from './decorators';

// Export RBAC/Casbin helpers
export * from './rbac';

// Export types explicitly to avoid ambiguity
export type { JwtPayload } from './types/jwt-payload.types';
