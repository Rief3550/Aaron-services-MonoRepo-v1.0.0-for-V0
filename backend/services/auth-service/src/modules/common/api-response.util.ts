import { Result } from '@aaron/common';
import { BadRequestException, HttpException } from '@nestjs/common';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ResponseOptions {
  message?: string;
}

export function toApiResponse<T>(result: Result<Error, T>, options: ResponseOptions = {}): ApiResponse<T> {
  if (result._tag === 'error') {
    const error = result.error;

    if (error instanceof HttpException) {
      throw error;
    }

    throw new BadRequestException(error?.message || 'Request failed');
  }

  const payload: ApiResponse<T> = { success: true };

  if (typeof result.value !== 'undefined') {
    payload.data = result.value;
  }

  if (options.message) {
    payload.message = options.message;
  }

  if (typeof payload.data === 'undefined' && !payload.message) {
    payload.data = result.value as T;
  }

  return payload;
}
