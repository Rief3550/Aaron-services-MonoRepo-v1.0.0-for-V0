/**
 * HttpExceptionFilter base for NestJS
 * Base class for global exception filters
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
export declare abstract class HttpExceptionFilter implements ExceptionFilter {
    abstract catch(exception: unknown, host: ArgumentsHost): void;
    protected getRequest(host: ArgumentsHost): Request;
    protected getResponse(host: ArgumentsHost): Response;
    protected sendErrorResponse(response: Response, statusCode: number, message: string, error?: any): void;
}
//# sourceMappingURL=http-exception.filter.d.ts.map