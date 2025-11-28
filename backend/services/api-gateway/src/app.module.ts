import { join } from 'path';
import { existsSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { GatewayModule } from './modules/gateway/gateway.module';
import { HealthModule } from './modules/health/health.module';

/**
 * AppModule
 * Módulo raíz del API Gateway
 * 
 * Configura:
 * - ConfigModule global para variables de entorno
 * - ThrottlerModule para rate limiting (120 req/min)
 * - GatewayModule para reverse proxy
 * - HealthModule para health checks
 * - ServeStaticModule para servir frontend compilado
 */
@Module({
  imports: [
    // ConfigModule global para acceso a variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Rate Limiter: 120 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60, // ventana de tiempo: 60 segundos
        limit: 120, // límite: 120 requests por ventana
      },
    ]),
    // Módulos de la aplicación
    GatewayModule,
    HealthModule,
    // Servir Frontend Estático (Next.js export) - Solo si existe
    // Si no existe, el ProxyMiddleware redirigirá al servidor de Next.js
    ...(existsSync(join(__dirname, '..', 'client', 'index.html'))
      ? [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/(.*)', '/auth/(.*)', '/ops/(.*)', '/tracking/(.*)'],
    }),
        ]
      : []),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
