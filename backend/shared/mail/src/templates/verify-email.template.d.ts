/**
 * Plantilla de email para verificación de cuenta
 */
export interface VerifyEmailData {
    email: string;
    verificationUrl: string;
    userName?: string;
}
export declare function generateVerifyEmailTemplate(data: VerifyEmailData): {
    html: string;
    text: string;
};
//# sourceMappingURL=verify-email.template.d.ts.map