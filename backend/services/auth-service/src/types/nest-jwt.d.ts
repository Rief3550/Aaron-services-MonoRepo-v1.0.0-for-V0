declare module '@nestjs/jwt' {
  import { DynamicModule } from '@nestjs/common';

  export interface JwtModuleOptions {
    secret?: string;
    signOptions?: Record<string, unknown>;
  }

  export class JwtService {
    sign(payload: any, options?: any): string;
    verify<T = any>(token: string, options?: any): T;
  }

  export class JwtModule {
    static register(options?: JwtModuleOptions): DynamicModule;
    static registerAsync(options: any): DynamicModule;
  }
}
