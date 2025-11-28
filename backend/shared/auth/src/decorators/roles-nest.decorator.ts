/**
 * Roles Decorator para NestJS
 * Usa SetMetadata para almacenar los roles requeridos
 */
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para especificar roles requeridos en métodos o clases de NestJS
 * Uso: @Roles('ADMIN', 'OPERATOR')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

