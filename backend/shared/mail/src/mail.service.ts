/**
 * Servicio de correo usando Resend o Gmail API
 */
import { Logger } from '@aaron/common';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const logger = new Logger('MailService');

export interface MailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
  cc?: string | string[];
}

export interface MailSendResult {
  id: string;
  error?: Error | null;
}

export class MailService {
  private resend?: Resend;
  private transporter?: nodemailer.Transporter;
  private defaultFrom: string;
  private provider: 'resend' | 'gmail';

  constructor(apiKey?: string, defaultFrom?: string) {
    this.defaultFrom = defaultFrom || process.env.MAIL_FROM || 'noreply@example.com';
    
    // Determinar qué proveedor usar
    const mailProvider = process.env.MAIL_PROVIDER || 'gmail';
    
    if (mailProvider === 'gmail') {
      this.provider = 'gmail';
      this.setupGmail();
    } else {
      this.provider = 'resend';
      const key = apiKey || process.env.RESEND_API_KEY || '';
      if (!key) {
        logger.warn('RESEND_API_KEY not provided, emails will fail');
      }
      this.resend = new Resend(key);
    }
  }

  private async setupGmail() {
    try {
      // Opción 1: Usar App Password (más simple)
      const gmailUser = process.env.GMAIL_USER;
      const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailAppPassword) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailAppPassword, // App Password de Gmail
          },
        });
        logger.info('Gmail transporter configured with App Password');
        return;
      }

      // Opción 2: Usar OAuth2 (más seguro, para producción)
      const gmailClientId = process.env.GMAIL_CLIENT_ID;
      const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
      const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;

      if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
        const oauth2Client = new google.auth.OAuth2(
          gmailClientId,
          gmailClientSecret,
          'https://developers.google.com/oauthplayground' // Redirect URL
        );

        oauth2Client.setCredentials({
          refresh_token: gmailRefreshToken,
        });

        const accessToken = await oauth2Client.getAccessToken();

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: gmailUser || process.env.GMAIL_USER,
            clientId: gmailClientId,
            clientSecret: gmailClientSecret,
            refreshToken: gmailRefreshToken,
            accessToken: accessToken?.token || '',
          },
        });
        logger.info('Gmail transporter configured with OAuth2');
        return;
      }

      logger.warn('Gmail not configured. Provide GMAIL_USER and GMAIL_APP_PASSWORD, or OAuth2 credentials');
    } catch (error) {
      logger.error('Failed to setup Gmail transporter', error);
    }
  }

  /**
   * Envía un email usando Resend o Gmail
   */
  async send(options: MailOptions): Promise<MailSendResult> {
    try {
      if (this.provider === 'gmail' && this.transporter) {
        return await this.sendViaGmail(options);
      } else if (this.provider === 'resend' && this.resend) {
        return await this.sendViaResend(options);
      } else {
        throw new Error('No email provider configured');
      }
    } catch (error) {
      logger.error('Failed to send email', error);
      return {
        id: '',
        error: error instanceof Error ? error : new Error('Unknown error sending email'),
      };
    }
  }

  private async sendViaGmail(options: MailOptions): Promise<MailSendResult> {
    if (!this.transporter) {
      throw new Error('Gmail transporter not configured');
    }

    const mailOptions = {
      from: options.from || this.defaultFrom,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
    };

    const info = await this.transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully via Gmail', { 
      messageId: info.messageId, 
      to: options.to 
    });
    
    return { 
      id: info.messageId || `gmail_${Date.now()}`, 
      error: null 
    };
  }

  private async sendViaResend(options: MailOptions): Promise<MailSendResult> {
    if (!this.resend) {
      throw new Error('Resend not configured');
    }

    const emailData: any = {
      from: options.from || this.defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    // Mock for dummy keys
    if (this.resend.key?.startsWith('re_dummy') || this.resend.key === 'dummy') {
      logger.warn('Mocking email send (Dummy Key detected)', { to: options.to, subject: options.subject });
      return { id: 'mock_id_' + Date.now(), error: null };
    }

    if (options.html) emailData.html = options.html;
    if (options.text) emailData.text = options.text;
    if (options.replyTo) emailData.reply_to = options.replyTo;
    if (options.bcc) emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    if (options.cc) emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];

    const result = await this.resend.emails.send(emailData);

    if (result.error) {
      logger.error('Resend API error', result.error);
      return { id: '', error: new Error(result.error.message) };
    }

    logger.info('Email sent successfully via Resend', { id: result.data?.id, to: options.to });
    return { id: result.data?.id || '', error: null };
  }

  /**
   * Verifica que la configuración esté correcta
   */
  isConfigured(): boolean {
    if (this.provider === 'gmail') {
      return !!this.transporter && (
        (!!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD) ||
        (!!process.env.GMAIL_CLIENT_ID && !!process.env.GMAIL_CLIENT_SECRET && !!process.env.GMAIL_REFRESH_TOKEN)
      );
    } else {
      return !!process.env.RESEND_API_KEY;
    }
  }
}
