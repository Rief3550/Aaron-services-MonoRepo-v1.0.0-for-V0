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
export declare class MailService {
    private resend;
    private defaultFrom;
    constructor(apiKey?: string, defaultFrom?: string);
    /**
     * Envía un email usando Resend
     */
    send(options: MailOptions): Promise<MailSendResult>;
    /**
     * Verifica que la configuración esté correcta
     */
    isConfigured(): boolean;
}
//# sourceMappingURL=mail.service.d.ts.map