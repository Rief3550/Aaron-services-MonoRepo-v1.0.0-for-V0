/**
 * Plantilla de email para reset de contraseña
 */

export interface ResetPasswordData {
  email: string;
  resetUrl: string;
  userName?: string;
  expiresIn?: string; // ej: "1 hora"
}

export function generateResetPasswordTemplate(data: ResetPasswordData): { html: string; text: string } {
  const { resetUrl, userName, email, expiresIn = '1 hora' } = data;
  const greeting = userName || email;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
    <h1 style="color: #dc2626; margin-top: 0;">Reset de contraseña</h1>
    <p style="font-size: 16px; color: #666; margin: 20px 0;">Hola ${greeting},</p>
    <p style="font-size: 16px; color: #666; margin: 20px 0;">Recibimos una solicitud para resetear tu contraseña.</p>
    <div style="margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Resetear contraseña</a>
    </div>
    <p style="font-size: 14px; color: #999; margin: 20px 0;">O copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #999; word-break: break-all; margin: 10px 0;">${resetUrl}</p>
    <p style="font-size: 14px; color: #999; margin-top: 30px;">Este enlace expirará en ${expiresIn}.</p>
    <p style="font-size: 14px; color: #999; margin-top: 20px; padding: 15px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #dc2626;"><strong>Importante:</strong> Si no solicitaste este reset, puedes ignorar este email. Tu contraseña no será cambiada.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Reset de contraseña

Hola ${greeting},

Recibimos una solicitud para resetear tu contraseña.

Haz clic en el siguiente enlace para resetear tu contraseña:
${resetUrl}

Este enlace expirará en ${expiresIn}.

IMPORTANTE: Si no solicitaste este reset, puedes ignorar este email. Tu contraseña no será cambiada.
  `.trim();

  return { html, text };
}

