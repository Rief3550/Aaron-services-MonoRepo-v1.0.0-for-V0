/**
 * JWT Auth Guard - Guard base reutilizable
 * Para servicios Express
 */
import { UnauthorizedException } from '@aaron/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwt-payload.types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class JwtAuthGuard {
  private secret: string;
  private publicRoutes: string[];

  constructor(secret: string, publicRoutes: string[] = []) {
    this.secret = secret;
    this.publicRoutes = publicRoutes;
  }

  /**
   * Middleware para Express
   */
  middleware() {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
      const url = req.originalUrl || req.url || '';

      // Permitir rutas públicas
      if (this.publicRoutes.some((p) => url.startsWith(p))) {
        return next();
      }

      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return next(new UnauthorizedException('Missing Bearer token'));
      }

      const token = auth.substring(7);

      try {
        const payload = jwt.verify(token, this.secret) as JwtPayload;

        if (payload.type && payload.type !== 'access') {
          return next(new UnauthorizedException('Invalid token type'));
        }

        // Normalizar userId/sub
        const userId = payload.userId || payload.sub;
        if (!userId) {
          return next(new UnauthorizedException('Invalid token payload'));
        }

        req.user = {
          ...payload,
          userId,
          sub: userId,
        };

        next();
      } catch (error) {
        return next(new UnauthorizedException('Invalid or expired token'));
      }
    };
  }

  /**
   * Verificar token y retornar payload
   */
  verifyToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.secret) as JwtPayload;

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return {
        ...payload,
        userId,
        sub: userId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verificar token desde query string (útil para WebSocket)
   */
  verifyTokenFromQuery(token?: string): JwtPayload | null {
    if (!token) {
      return null;
    }
    try {
      return this.verifyToken(token);
    } catch {
      return null;
    }
  }
}
