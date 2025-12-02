import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';

import { JwtPayload } from './jwt-auth.guard';

/**
 * ActiveClientGuard
 * 
 * Verifica que el cliente esté en estado ACTIVO antes de permitir acceso a endpoints.
 * Útil para endpoints que requieren una cuenta activa (ej: crear órdenes de trabajo).
 * 
 * Solo aplica a usuarios con rol CUSTOMER. ADMIN y OPERATOR siempre tienen acceso.
 * 
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard, ActiveClientGuard)
 * @Post('request')
 * @Roles('CUSTOMER', 'ADMIN', 'OPERATOR')
 * async createRequest() { ... }
 * ```
 */
@Injectable()
export class ActiveClientGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // ADMIN y OPERATOR siempre tienen acceso (no necesitan ser clientes activos)
    if (user.roles && (user.roles.includes('ADMIN') || user.roles.includes('OPERATOR'))) {
      return true;
    }

    // Solo validar para CUSTOMER
    if (!user.roles || !user.roles.includes('CUSTOMER')) {
      // Si no es CUSTOMER y tampoco es ADMIN/OPERATOR, permitir acceso
      // (puede ser otro rol que no requiere validación)
      return true;
    }

    // Buscar el cliente asociado al usuario
    const client = await prisma.client.findUnique({
      where: { userId: user.userId },
      select: { id: true, estado: true, nombreCompleto: true },
    });

    if (!client) {
      throw new ForbiddenException(
        'Client profile not found. Please complete your registration.',
      );
    }

    // Verificar que el cliente esté ACTIVO
    if (client.estado !== 'ACTIVO') {
      const estadoMessages: Record<string, string> = {
        PENDIENTE: 'Tu cuenta está pendiente de aprobación. Recibirás un email cuando puedas usar los servicios.',
        EN_PROCESO: 'Tu cuenta está siendo procesada. Por favor espera a que sea activada.',
        SUSPENDIDO: 'Tu cuenta ha sido suspendida. Por favor contacta a soporte.',
        INACTIVO: 'Tu cuenta ha sido desactivada. Por favor contacta a soporte.',
      };

      const message = estadoMessages[client.estado] || 
        'Tu cuenta no está activa. Por favor contacta a soporte.';

      throw new ForbiddenException(message);
    }

    return true;
  }
}


