/**
 * Policies Guard - ABAC/Casbin
 * Valida políticas más complejas usando Casbin (opcional, para futuro)
 */
import { ForbiddenException } from '@aaron/common';
import { Response, NextFunction } from 'express';

import { AuthRequest } from './jwt-auth.guard';

export interface Policy {
  subject: string; // Usuario o rol
  object: string;  // Recurso
  action: string;  // Acción
}

export class PoliciesGuard {
  private policies: Policy[];
  private casbinEnabled: boolean = false;

  constructor(policies: Policy[] = []) {
    this.policies = policies;
  }

  /**
   * Habilitar Casbin (cuando se implemente)
   */
  enableCasbin(enabled: boolean = true) {
    this.casbinEnabled = enabled;
    return this;
  }

  /**
   * Middleware para Express
   */
  middleware() {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new ForbiddenException('User not authenticated'));
      }

      // Si Casbin está habilitado, usar CasbinHelper
      if (this.casbinEnabled) {
        try {
          // TODO: Implementar con CasbinHelper de libs/auth/src/rbac
          // const casbinHelper = new CasbinHelper();
          // const allowed = await casbinHelper.checkPermission(...);
          // if (!allowed) {
          //   return next(new ForbiddenException('Policy check failed'));
          // }
          next();
        } catch (error) {
          return next(new ForbiddenException('Policy check error'));
        }
      }

      // Validación básica con políticas estáticas
      const userRoles = req.user.roles || [];
      const userId = req.user.userId || req.user.sub || '';

      // Verificar si alguna política permite el acceso
      const allowed = this.policies.some((policy) => {
        // Verificar por rol
        if (policy.subject && userRoles.includes(policy.subject)) {
          return true;
        }
        // Verificar por userId
        if (policy.subject === userId) {
          return true;
        }
        return false;
      });

      if (!allowed && this.policies.length > 0) {
        return next(new ForbiddenException('Policy check failed'));
      }

      next();
    };
  }

  /**
   * Factory para crear guard con política específica
   */
  static requirePolicy(subject: string, object: string, action: string) {
    return new PoliciesGuard([{ subject, object, action }]);
  }
}

