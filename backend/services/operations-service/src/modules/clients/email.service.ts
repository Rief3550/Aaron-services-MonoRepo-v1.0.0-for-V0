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
      const subject = '¡Bienvenido a Aaron Services! Tu cuenta está activa';
      
      // Paleta de colores del manual
      const colors = {
        primary: '#F9782E',    // Naranja
        secondary: '#294C75',  // Azul Oscuro
        text: '#333333',
        background: '#FFFAFA',
        gray: '#BABABA'
      };
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¡Bienvenido a Aaron Services!</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: ${colors.text}; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: ${colors.secondary}; padding: 30px 20px; text-align: center; }
            .logo { max-width: 200px; height: auto; }
            .content { padding: 40px 30px; background-color: ${colors.background}; }
            .h1 { color: ${colors.secondary}; margin-top: 0; font-size: 24px; font-weight: 700; }
            .highlight-box { background-color: #fff; border-left: 4px solid ${colors.primary}; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: 600; margin: 20px 0; box-shadow: 0 2px 4px rgba(249, 120, 46, 0.3); }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: ${colors.gray}; border-top: 1px solid #e5e7eb; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${LOGO_BASE64 ? `<img src="data:image/png;base64,${LOGO_BASE64}" alt="Aaron Services" class="logo">` : '<div style="color: white; font-size: 24px; font-weight: 700;">AARON SERVICES</div>'}
            </div>
            
            <div class="content">
              <h1 class="h1">¡Bienvenido, ${nombreCompleto || 'Cliente'}!</h1>
              
              <p>Nos complace informarte que tu solicitud ha sido <strong>aprobada</strong> y tu cuenta ha sido <strong>activada exitosamente</strong>.</p>
              
              ${planNombre ? `
              <div class="highlight-box">
                <p style="margin: 0;"><strong>Tu plan activo:</strong> ${planNombre}</p>
              </div>
              ` : ''}
              
              <p><strong>¿Qué puedes hacer ahora?</strong></p>
              <ul>
                <li>📱 <strong>Descargar la app móvil</strong> y comenzar a solicitar servicios</li>
                <li>🏠 Gestionar tus propiedades y suscripciones</li>
                <li>🔧 Solicitar servicios de mantenimiento y reparación</li>
                <li>📊 Acceder a todas las funcionalidades de tu plan</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="btn">Descargar App Móvil</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Si tienes alguna pregunta o necesitas asistencia, nuestro equipo está listo para ayudarte.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Equipo de Aaron Services</strong></p>
              <p>&copy; ${new Date().getFullYear()} Aaron Services. Todos los derechos reservados.</p>
              <p style="margin-top: 10px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
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

