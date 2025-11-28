export declare class Logger {
    private readonly context?;
    constructor(context?: string);
    private formatMessage;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
//# sourceMappingURL=logger.service.d.ts.map