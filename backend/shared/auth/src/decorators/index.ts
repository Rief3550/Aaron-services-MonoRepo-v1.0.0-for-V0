/**
 * Decorators de autenticación - Exportaciones
 */
export * from './current-user.decorator';
export * from './current-user-nest.decorator';

// 1. Export NestJS Decorator as 'Roles' (Priority)
export { Roles, ROLES_KEY } from './roles-nest.decorator';

// 2. Export Express Helper
export { requireRoles } from './roles.decorator';
