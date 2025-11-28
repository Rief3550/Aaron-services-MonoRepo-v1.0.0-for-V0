/**
 * Middleware de validación con Zod
 */
import { ValidationException } from '@aaron/common';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          if (!acc[path]) acc[path] = [];
          acc[path].push(err.message);
          return acc;
        }, {} as Record<string, string[]>);

        next(new ValidationException('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

