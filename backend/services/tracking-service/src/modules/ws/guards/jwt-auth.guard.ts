import { JwtPayload } from '@aaron/auth';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtAuthRequest extends Request {
  user?: (JwtPayload & { userId: string; crewId?: string }) | undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwtSecret: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 
                     this.configService.get<string>('JWT_ACCESS_SECRET') || '';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<JwtAuthRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;

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
        crewId: (payload as any)?.crewId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const auth = request.headers.authorization || request.headers.Authorization;
    if (!auth || typeof auth !== 'string') return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
