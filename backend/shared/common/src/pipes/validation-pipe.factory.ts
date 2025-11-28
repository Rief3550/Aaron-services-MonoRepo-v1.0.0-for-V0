/**
 * ValidationPipe global factory for NestJS
 * Creates a configured ValidationPipe instance with common settings
 */
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export function createGlobalValidationPipe(options?: Partial<ValidationPipeOptions>): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
    ...options,
  });
}

