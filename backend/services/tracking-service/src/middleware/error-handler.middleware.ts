/**
 * Middleware de manejo de errores
 */
import { BaseException, ValidationException } from '@aaron/common';
import { Logger } from '@aaron/common';
import { Request, Response, NextFunction } from 'express';

const logger = new Logger('ErrorHandler');

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', err);

  if (err instanceof BaseException) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message,
        ...(err instanceof ValidationException && { errors: err.errors }),
      },
    });
  }

  // Error de Prisma
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE',
        message: 'Resource already exists',
      },
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
    },
  });
}

