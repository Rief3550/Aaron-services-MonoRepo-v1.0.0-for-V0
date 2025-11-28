/**
 * Unit tests for JwtAuthGuard
 */
import { ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.JWT_PUBLIC_ROUTES = '/auth/signup,/auth/signin';
    guard = new JwtAuthGuard();

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          originalUrl: '/ops/work-orders',
          headers: {
            authorization: 'Bearer fake-token',
          },
        }),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should allow public routes without token', () => {
      const publicContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/auth/signup',
            headers: {},
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      expect(guard.canActivate(publicContext)).toBe(true);
    });

    it('should reject requests without token on protected routes', () => {
      const noTokenContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/ops/work-orders',
            headers: {},
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(noTokenContext)).toThrow();
    });

    it('should reject invalid tokens', () => {
      const invalidTokenContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/ops/work-orders',
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(invalidTokenContext)).toThrow();
    });
  });
});

