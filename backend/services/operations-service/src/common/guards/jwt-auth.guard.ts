import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  roles?: string[];
  type?: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userId: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers?.['authorization'] || request.headers?.['Authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        ...payload,
        userId,
        sub: userId,
      };

      // Log para debugging - verificar si los roles están presentes
      if (!payload.roles || !Array.isArray(payload.roles) || payload.roles.length === 0) {
        console.warn('[JwtAuthGuard] Token does not contain roles:', { userId, email: payload.email, payloadKeys: Object.keys(payload) });
      } else {
        console.log('[JwtAuthGuard] Token contains roles:', payload.roles);
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
