/**
 * Types for JwtPayload
 */
export interface JwtPayload {
    userId?: string;
    sub?: string;
    email?: string;
    roles?: string[];
    type?: string;
    iat?: number;
    exp?: number;
    [key: string]: any;
}
//# sourceMappingURL=jwt-payload.types.d.ts.map