/**
 * Plantilla de email para verificación de cuenta
 */

export interface VerifyEmailData {
  email: string;
  verificationUrl: string;
  userName?: string;
}

export function generateVerifyEmailTemplate(data: VerifyEmailData): { html: string; text: string } {
  const { verificationUrl, userName, email } = data;
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
    <h1 style="color: #2563eb; margin-top: 0;">Verifica tu email</h1>
    <p style="font-size: 16px; color: #666; margin: 20px 0;">Hola ${greeting},</p>
    <p style="font-size: 16px; color: #666; margin: 20px 0;">Gracias por registrarte. Para completar tu registro, necesitamos verificar tu dirección de email.</p>
    <div style="margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Verificar email</a>
    </div>
    <p style="font-size: 14px; color: #999; margin: 20px 0;">O copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #999; word-break: break-all; margin: 10px 0;">${verificationUrl}</p>
    <p style="font-size: 14px; color: #999; margin-top: 30px;">Este enlace expirará en 24 horas.</p>
    <p style="font-size: 14px; color: #999; margin-top: 20px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Verifica tu email

Hola ${greeting},

Gracias por registrarte. Para completar tu registro, necesitamos verificar tu dirección de email.

Haz clic en el siguiente enlace para verificar tu cuenta:
${verificationUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este email.
  `.trim();

  return { html, text };
}

