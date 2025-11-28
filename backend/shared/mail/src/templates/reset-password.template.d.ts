/**
 * Plantilla de email para reset de contraseña
 */
export interface ResetPasswordData {
    email: string;
    resetUrl: string;
    userName?: string;
    expiresIn?: string;
}
export declare function generateResetPasswordTemplate(data: ResetPasswordData): {
    html: string;
    text: string;
};
//# sourceMappingURL=reset-password.template.d.ts.map