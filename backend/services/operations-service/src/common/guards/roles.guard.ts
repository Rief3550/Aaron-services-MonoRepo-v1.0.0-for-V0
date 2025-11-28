import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

import { JwtPayload } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    // Logging para debugging
    console.log('[RolesGuard] Checking permissions:', {
      requiredRoles,
      userRoles: user?.roles,
      userId: user?.userId,
      email: user?.email,
    });

    if (!user || !Array.isArray(user.roles) || user.roles.length === 0) {
      console.warn('[RolesGuard] User roles not present in token', { user });
      throw new ForbiddenException('User roles not present in token');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      console.warn('[RolesGuard] Insufficient permissions', {
        requiredRoles,
        userRoles: user.roles,
        hasRole,
      });
      throw new ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(', ')}, User has: ${user.roles.join(', ')}`);
    }

    console.log('[RolesGuard] Access granted', { requiredRoles, userRoles: user.roles });
    return true;
  }
}

