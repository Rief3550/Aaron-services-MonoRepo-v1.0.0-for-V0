"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
/**
 * Servicio de correo usando Resend
 */
const resend_1 = require("resend");
const common_1 = require("@aaron/common");
const logger = new common_1.Logger('MailService');
class MailService {
    resend;
    defaultFrom;
    constructor(apiKey, defaultFrom) {
        const key = apiKey || process.env.RESEND_API_KEY || '';
        if (!key) {
            logger.warn('RESEND_API_KEY not provided, emails will fail');
        }
        this.resend = new resend_1.Resend(key);
        this.defaultFrom = defaultFrom || process.env.MAIL_FROM || 'noreply@example.com';
    }
    /**
     * Envía un email usando Resend
     */
    async send(options) {
        try {
            const result = await this.resend.emails.send({
                from: options.from || this.defaultFrom,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
                replyTo: options.replyTo,
                bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
                cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
            });
            if (result.error) {
                logger.error('Resend API error', result.error);
                return { id: '', error: new Error(result.error.message) };
            }
            logger.info('Email sent successfully', { id: result.data?.id, to: options.to });
            return { id: result.data?.id || '', error: null };
        }
        catch (error) {
            logger.error('Failed to send email', error);
            return {
                id: '',
                error: error instanceof Error ? error : new Error('Unknown error sending email'),
            };
        }
    }
    /**
     * Verifica que la configuración esté correcta
     */
    isConfigured() {
        return !!process.env.RESEND_API_KEY;
    }
}
exports.MailService = MailService;
//# sourceMappingURL=mail.service.js.map