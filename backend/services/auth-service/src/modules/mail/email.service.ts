import { Result } from '@aaron/common';
import { MailService } from '@aaron/mail';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { prisma } from '../../config/database';

// Cargar logo en Base64
let LOGO_BASE64 = '';
try {
  const logoPath = path.join(__dirname, 'logo-base64.txt');
  if (fs.existsSync(logoPath)) {
    LOGO_BASE64 = fs.readFileSync(logoPath, 'utf8').trim();
  }
} catch (error) {
  console.warn('Logo Base64 no encontrado, usando placeholder');
}

@Injectable()
export class EmailService {
  private mailService: MailService;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.from = this.configService.get<string>('MAIL_FROM') || 'noreply@example.com';
    this.mailService = new MailService(apiKey, this.from);
  }

  async sendVerificationEmail(email: string, userId: string, token: string, lat?: number, lng?: number): Promise<Result<Error, void>> {
    try {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      // Generar código de 6 dígitos para verificación desde app móvil
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

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
          <title>Verifica tu email - AARON SERVICES</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: ${colors.text}; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: ${colors.secondary}; padding: 30px 20px; text-align: center; }
            .logo { max-width: 200px; height: auto; }
            .content { padding: 40px 30px; background-color: ${colors.background}; }
            .h1 { color: ${colors.secondary}; margin-top: 0; font-size: 24px; font-weight: 700; }
            .code-box { background-color: #fff; border: 2px solid ${colors.primary}; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center; }
            .code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: ${colors.primary}; letter-spacing: 8px; margin: 0; }
            .code-label { color: ${colors.gray}; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: ${colors.gray}; border-top: 1px solid #e5e7eb; }
            .text-center { text-align: center; }
            .text-muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${LOGO_BASE64 ? `<img src="data:image/png;base64,${LOGO_BASE64}" alt="Aaron Services" class="logo">` : '<div style="color: white; font-size: 24px; font-weight: 700;">AARON SERVICES</div>'}
            </div>
            
            <div class="content">
              <h1 class="h1">Verifica tu dirección de email</h1>
              
              <p>Gracias por registrarte en <strong>Aaron Services</strong>. Para completar tu registro y asegurar la seguridad de tu cuenta, por favor ingresa el siguiente código de verificación en la aplicación móvil:</p>
              
              <div class="code-box">
                <p class="code-label">Tu Código de Verificación</p>
                <p class="code">${verificationCode}</p>
              </div>
              
              <p class="text-center text-muted" style="font-size: 14px;">
                Este código expirará en 24 horas.
              </p>
              
              <p style="margin-top: 30px; font-size: 14px;">
                Si no has solicitado este registro, puedes ignorar este correo electrónico de forma segura.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Aaron Services. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `Verifica tu email ingresando este código en la aplicación móvil:\n\nCódigo de verificación: ${verificationCode}\n\nEste código expira en 24 horas.\n\nSi no creaste una cuenta en AARON SERVICIOS, puedes ignorar este email.`;

      const result = await this.mailService.send({
        from: this.from,
        to: email,
        subject: 'Verifica tu email - AARON SERVICIOS',
        html,
        text,
      });

      // Log in EmailAudit (guardamos lat/lng en meta para recuperarlos después)
      await prisma.emailAudit.create({
        data: {
          userId,
          email,
          type: 'VERIFY',
          status: result.error ? 'FAILED' : 'SENT',
          meta: { 
            token, 
            verificationCode,
            resendId: result.id, 
            expiresAt,
            lat,
            lng,
          },
        },
      });

      if (result.error) {
        return Result.error(result.error);
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to send email'));
    }
  }

  async sendResetPasswordEmail(email: string, userId: string, token: string): Promise<Result<Error, void>> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      const expiresAt = Date.now() + 3600000; // 1 hour

      // Template HTML para reset password
      const colors = {
        primary: '#F9782E',
        secondary: '#294C75',
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
          <title>Restablecer Contraseña - AARON SERVICES</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: ${colors.text}; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: ${colors.secondary}; padding: 30px 20px; text-align: center; }
            .logo { max-width: 200px; height: auto; }
            .content { padding: 40px 30px; background-color: ${colors.background}; }
            .h1 { color: ${colors.secondary}; margin-top: 0; font-size: 24px; font-weight: 700; }
            .btn { display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: 600; margin: 20px 0; box-shadow: 0 2px 4px rgba(249, 120, 46, 0.3); }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: ${colors.gray}; border-top: 1px solid #e5e7eb; }
            .text-muted { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${LOGO_BASE64 ? `<img src="data:image/png;base64,${LOGO_BASE64}" alt="Aaron Services" class="logo">` : '<div style="color: white; font-size: 24px; font-weight: 700;">AARON SERVICES</div>'}
            </div>
            
            <div class="content">
              <h1 class="h1">Restablecer Contraseña</h1>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Aaron Services</strong>.</p>
              
              <p>Para continuar con el proceso y crear una nueva contraseña, haz clic en el siguiente botón:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Restablecer mi contraseña</a>
              </div>
              
              <p class="text-muted">
                Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.
              </p>
              
              <p class="text-muted" style="margin-top: 20px; font-size: 12px;">
                Si tienes problemas con el botón, copia y pega el siguiente enlace en tu navegador:<br>
                <a href="${resetUrl}" style="color: ${colors.secondary}; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Aaron Services. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `Restablece tu contraseña visitando el siguiente enlace: ${resetUrl}\n\nEste enlace expira en 1 hora.`;

      const result = await this.mailService.send({
        from: this.from,
        to: email,
        subject: 'Restablece tu contraseña - AARON SERVICES',
        html,
        text,
      });

      // Log in EmailAudit
      await prisma.emailAudit.create({
        data: {
          userId,
          email,
          type: 'RESET',
          status: result.error ? 'FAILED' : 'SENT',
          meta: { token, resetUrl, expiresAt, resendId: result.id },
        },
      });

      if (result.error) {
        return Result.error(result.error);
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to send email'));
    }
  }
}
