/**
 * Roles Guard - RBAC
 * Valida que el usuario tenga al menos uno de los roles requeridos
 */
import { ForbiddenException } from '@aaron/common';
import { Response, NextFunction } from 'express';

import { AuthRequest } from './jwt-auth.guard';

export class RolesGuard {
  private allowedRoles: string[];

  constructor(...allowedRoles: string[]) {
    this.allowedRoles = allowedRoles;
  }

  /**
   * Middleware para Express
   */
  middleware() {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new ForbiddenException('User not authenticated'));
      }

      const userRoles = req.user.roles || [];
      const hasRole = this.allowedRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return next(
          new ForbiddenException(
            `Insufficient permissions. Required roles: ${this.allowedRoles.join(', ')}`
          )
        );
      }

      next();
    };
  }

  /**
   * Factory para crear guard con roles específicos
   */
  static require(...roles: string[]) {
    return new RolesGuard(...roles);
  }

  /**
   * Verificar si usuario tiene rol
   */
  static hasRole(user: { roles?: string[] }, role: string): boolean {
    return (user.roles || []).includes(role);
  }

  /**
   * Verificar si usuario tiene alguno de los roles
   */
  static hasAnyRole(user: { roles?: string[] }, roles: string[]): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Verificar si usuario tiene todos los roles
   */
  static hasAllRoles(user: { roles?: string[] }, roles: string[]): boolean {
    return roles.every((role) => this.hasRole(user, role));
  }
}
