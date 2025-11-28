/**
 * HttpExceptionFilter base for NestJS
 * Base class for global exception filters
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

export abstract class HttpExceptionFilter implements ExceptionFilter {
  abstract catch(exception: unknown, host: ArgumentsHost): void;

  protected getRequest(host: ArgumentsHost): Request {
    const ctx = host.switchToHttp();
    return ctx.getRequest<Request>();
  }

  protected getResponse(host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    return ctx.getResponse<Response>();
  }

  protected sendErrorResponse(response: Response, statusCode: number, message: string, error?: any) {
    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      ...(error && process.env.NODE_ENV === 'development' && { error }),
    });
  }
}

