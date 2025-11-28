import { BaseException } from './base.exception';

export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

