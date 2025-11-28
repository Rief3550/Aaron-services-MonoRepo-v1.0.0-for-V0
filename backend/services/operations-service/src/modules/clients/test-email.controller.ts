import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClientEmailService } from './email.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('test-email')
export class TestEmailController {
  constructor(private readonly emailService: ClientEmailService) {}

  /**
   * Endpoint de prueba para enviar email de activación
   * POST /ops/test-email/activation
   */
  @Post('activation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async testActivationEmail(@Body() body: { email: string; nombreCompleto?: string; planNombre?: string }) {
    try {
      await this.emailService.sendActivationEmail(
        body.email,
        body.nombreCompleto || 'Cliente de Prueba',
        body.planNombre || 'Plan de Prueba',
      );
      return {
        success: true,
        message: 'Email de activación enviado correctamente',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al enviar email',
      };
    }
  }
}


