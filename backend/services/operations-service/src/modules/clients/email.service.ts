import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@aaron/mail';
import { Logger } from '@aaron/common';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('ClientEmailService');

// Cargar logo en base64
let LOGO_BASE64 = '';
try {
  // Intentar desde dist/ (producción) y src/ (desarrollo)
  const logoPaths = [
    path.join(__dirname, 'logo-base64.txt'), // dist/modules/clients/logo-base64.txt
    path.join(__dirname, '../clients/logo-base64.txt'), // fallback
    path.join(process.cwd(), 'backend/services/operations-service/src/modules/clients/logo-base64.txt'), // desarrollo
  ];
  
  for (const logoPath of logoPaths) {
    if (fs.existsSync(logoPath)) {
      LOGO_BASE64 = fs.readFileSync(logoPath, 'utf8').trim();
      logger.info('Logo cargado correctamente desde:', logoPath);
      break;
    }
  }
  
  if (!LOGO_BASE64) {
    logger.warn('Logo file not found in any location, using text fallback');
  }
} catch (error) {
  logger.warn('Error loading logo, using text fallback', error);
}

@Injectable()
export class ClientEmailService {
  private mailService: MailService;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.from = this.configService.get<string>('MAIL_FROM') || 'noreply@aaronservicios.com';
    this.mailService = new MailService(apiKey, this.from);
  }

  /**
   * Envía email de bienvenida cuando se activa un cliente
   */
  async sendActivationEmail(
    email: string,
    nombreCompleto: string,
    planNombre?: string,
  ): Promise<void> {
    try {
      const subject = '¡Bienvenido a AARON SERVICIOS!';
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a AARON SERVICIOS</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e40af; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            ${LOGO_BASE64 ? `<img src="data:image/png;base64,${LOGO_BASE64}" alt="AARON SERVICIOS" style="max-width: 200px; height: auto; margin: 0 auto; display: block;" />` : '<h1 style="margin: 0; color: white;">AARON SERVICIOS</h1>'}
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1e40af; margin-top: 0;">¡Bienvenido, ${nombreCompleto || 'Cliente'}!</h2>
            
            <p>Nos complace informarte que tu solicitud ha sido <strong>aprobada</strong> y tu cuenta ha sido <strong>activada</strong>.</p>
            
            ${planNombre ? `<p>Tu plan activo es: <strong>${planNombre}</strong></p>` : ''}
            
            <p>Ahora puedes:</p>
            <ul>
              <li>Solicitar servicios de mantenimiento y reparación</li>
              <li>Acceder a todas las funcionalidades de tu plan</li>
              <li>Gestionar tus propiedades y suscripciones</li>
            </ul>
            
            <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Saludos cordiales,<br><strong>Equipo de AARON SERVICIOS</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
¡Bienvenido a AARON SERVICIOS!

Hola ${nombreCompleto || 'Cliente'},

Nos complace informarte que tu solicitud ha sido aprobada y tu cuenta ha sido activada.

${planNombre ? `Tu plan activo es: ${planNombre}` : ''}

Ahora puedes:
- Solicitar servicios de mantenimiento y reparación
- Acceder a todas las funcionalidades de tu plan
- Gestionar tus propiedades y suscripciones

Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.

Saludos cordiales,
Equipo de AARON SERVICIOS
      `;

      const result = await this.mailService.send({
        from: this.from,
        to: email,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error('Error sending activation email', result.error);
        throw result.error;
      }

      logger.info('Activation email sent successfully', { email, messageId: result.id });
    } catch (error) {
      logger.error('Failed to send activation email', error);
      // No lanzamos el error para que la activación continúe aunque falle el email
    }
  }
}

