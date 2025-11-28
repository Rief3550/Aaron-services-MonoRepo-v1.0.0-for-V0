import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  constructor(
    message: string = 'Validation failed',
    public readonly errors?: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

