/**
 * @CurrentUser decorator for NestJS (empty stub)
 * To be implemented when migrating to NestJS
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { JwtPayload } from '../types/jwt-payload.types';

/**
 * Decorator to get current user from request
 * Usage: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  }
);

