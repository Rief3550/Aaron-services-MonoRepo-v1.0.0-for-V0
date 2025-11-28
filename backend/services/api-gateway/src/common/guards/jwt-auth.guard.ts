import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId?: string;
  sub?: string;
  email?: string;
  roles?: string[];
  type?: string;
  [key: string]: any;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private publicRoutes: string[] = [];
  private secret: string;

  constructor() {
    // Use JWT_ACCESS_SECRET if available, fallback to JWT_SECRET for compatibility
    this.secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '';
    
    if (!this.secret) {
      console.warn('[JwtAuthGuard] No JWT secret found in environment variables');
    } else {
      console.log('[JwtAuthGuard] JWT secret loaded successfully');
    }
    
    const env = process.env.JWT_PUBLIC_ROUTES || '';
    this.publicRoutes = env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    
    console.log('[JwtAuthGuard] Public routes:', this.publicRoutes);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const url: string = req.originalUrl || req.url || '';

    // Permitir rutas públicas (prefix match)
    if (this.publicRoutes.some((p) => url.startsWith(p))) return true;

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.substring('Bearer '.length);

    try {
      const payload = jwt.verify(token, this.secret) as JwtPayload;

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Normalizar userId/sub
      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Policy hints: verificación básica de roles si la ruta lo requiere
      const policyHint = this.checkPolicyHints(url, payload);
      if (policyHint === false) {
        throw new ForbiddenException('Access denied by policy hint');
      }

      // Asignar usuario al request
      (req as any).user = {
        ...payload,
        userId,
        sub: userId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Log specific JWT errors for debugging
      if (error instanceof Error) {
        console.error('[JwtAuthGuard] JWT verification failed:', error.message);
      }
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Policy hints: Validación temprana de roles antes de enrutar
   * Opcional: puede negar acceso temprano si detecta que el usuario no tiene roles suficientes
   */
  private checkPolicyHints(url: string, payload: JwtPayload): boolean | null {
    // Ejemplo: Si la ruta empieza con /ops/admin, verificar rol ADMIN
    // Esto puede evitar requests innecesarios al servicio downstream
    const policyHints = process.env.JWT_POLICY_HINTS || '';

    if (!policyHints || policyHints === 'false') {
      return null; // No aplicar policy hints
    }

    const userRoles = payload.roles || [];

    // Verificar rutas administrativas
    if (url.startsWith('/ops/admin') || url.startsWith('/ops/users') || url.startsWith('/ops/roles')) {
      if (!userRoles.includes('ADMIN')) {
        return false; // Negar acceso temprano
      }
    }

    // Verificar rutas de operador
    if (url.startsWith('/ops/work-orders') && url.includes('/delete')) {
      if (!userRoles.includes('ADMIN') && !userRoles.includes('OPERATOR')) {
        return false;
      }
    }

    return true; // Permitir (la validación completa se hará en el servicio)
  }
}

