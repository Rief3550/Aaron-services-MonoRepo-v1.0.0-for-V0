/**
 * Guard de autenticación JWT para tracking-service
 * Para proteger endpoints HTTP (POST /track/ping)
 */
import { UnauthorizedException } from '@aaron/common';
import { Request, Response, NextFunction } from 'express';

import { JwtService } from '../services/jwt.service';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    roles?: string[];
  };
}

export class JwtAuthGuard {
  static middleware() {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      
      if (!auth || !auth.startsWith('Bearer ')) {
        return next(new UnauthorizedException('Missing Bearer token'));
      }

      const token = auth.substring(7);
      const payload = JwtService.verifyToken(token);

      if (!payload) {
        return next(new UnauthorizedException('Invalid or expired token'));
      }

      req.user = payload;
      next();
    };
  }
}

