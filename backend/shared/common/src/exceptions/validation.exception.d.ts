import { BaseException } from './base.exception';
export declare class ValidationException extends BaseException {
    readonly errors?: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
}
//# sourceMappingURL=validation.exception.d.ts.map