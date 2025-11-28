/**
 * Servicio de JWT para tracking-service
 */
import { Logger } from '@aaron/common';
import * as jwt from 'jsonwebtoken';

import { config } from '../config/env';

const logger = new Logger('JWTService');

export interface TokenPayload {
  userId: string;
  email?: string;
  roles?: string[];
}

export class JwtService {
  /**
   * Verifica un token JWT
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const userId = decoded.userId || decoded.sub;
      if (!userId) {
        logger.warn('Token missing userId/sub');
        return null;
      }

      return {
        userId,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    } catch (error) {
      logger.error('Token verification failed', error);
      return null;
    }
  }

  /**
   * Verifica token desde query string (útil para WebSocket)
   */
  static verifyTokenFromQuery(token?: string): TokenPayload | null {
    if (!token) {
      return null;
    }
    return this.verifyToken(token);
  }
}
