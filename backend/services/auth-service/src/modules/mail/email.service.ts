import { Result } from '@aaron/common';
import { MailService } from '@aaron/mail';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { prisma } from '../../config/database';

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

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu email - AARON SERVICIOS</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">AARON SERVICIOS</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1e40af; margin-top: 0;">Verifica tu dirección de email</h2>
            
            <p>Gracias por registrarte en AARON SERVICIOS. Para completar tu registro, por favor ingresa este código de verificación en la aplicación móvil:</p>
            
            <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #1e40af;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px; font-weight: 600;">Código de verificación:</p>
              <p style="font-size: 48px; font-weight: bold; color: #1e40af; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace;">${verificationCode}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
              Ingresa este código en la pantalla de verificación de la app móvil.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Este código expira en 24 horas.</p>
            
            <p style="font-size: 14px; color: #6b7280;">Si no creaste una cuenta en AARON SERVICIOS, puedes ignorar este email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Saludos cordiales,<br><strong>Equipo de AARON SERVICIOS</strong></p>
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

      // Simple text template
      const text = `Restablece tu contraseña haciendo clic en: ${resetUrl}\n\nEste enlace expira en 1 hora.`;

      const result = await this.mailService.send({
        from: this.from,
        to: email,
        subject: 'Restablece tu contraseña',
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
