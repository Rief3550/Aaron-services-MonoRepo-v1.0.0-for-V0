export declare class BaseException extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly code?: string;
    constructor(message: string, statusCode?: number, code?: string);
}
//# sourceMappingURL=base.exception.d.ts.map