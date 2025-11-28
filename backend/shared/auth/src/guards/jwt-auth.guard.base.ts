/**
 * Base JWT Auth Guard - Reutilizable por todos los servicios
 * Para usar en servicios Express (no NestJS), importar y extender
 */
import { UnauthorizedException } from '@aaron/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwt-payload.types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class JwtAuthGuardBase {
  private publicRoutes: string[] = [];
  private secret: string;

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
        throw new UnauthorizedException('Missing Bearer token');
      }

      const token = auth.substring(7);

      try {
        const payload = jwt.verify(token, this.secret) as JwtPayload;
        
        if (payload.type && payload.type !== 'access') {
          throw new UnauthorizedException('Invalid token type');
        }

        req.user = payload;
        next();
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    };
  }

  /**
   * Verificar token y retornar payload
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
