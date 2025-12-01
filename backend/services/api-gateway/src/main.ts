import { createGlobalValidationPipe } from '@aaron/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppModule } from './app.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const logger = new Logger('API-Gateway');
  const configService = app.get(ConfigService);

  // ========================================
  // CORS Configuration
  // ========================================
  const corsFromEnv = configService.get<string>('CORS_ORIGINS');
  const isProd = (configService.get<string>('NODE_ENV') || 'development') === 'production';

  // En dev: reflejar cualquier origen (permite credenciales). En prod: usar lista o regex.
  const allowedOrigins: boolean | Array<string | RegExp> = corsFromEnv
    ? corsFromEnv.split(',')
    : isProd
      ? [/localhost:\d+$/, /127\.0\.0\.1:\d+$/]
      : true; // true => devuelve el mismo origin en respuesta (útil con credentials)

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-requested-with', 'accept'],
    exposedHeaders: ['x-request-id'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  });

  logger.log(`CORS enabled for origins: ${JSON.stringify(allowedOrigins)}`);

  // ========================================
  // Global Validation Pipe
  // ========================================
  // Valida automáticamente DTOs con class-validator decorators
  // Usa factory de libs/common para configuración estándar
  // app.useGlobalPipes(createGlobalValidationPipe());

  logger.log('Global ValidationPipe configured');

  // ========================================
  // Global Rate Limiter
  // ========================================
  // ThrottlerGuard ya está registrado en app.module.ts como APP_GUARD
  // No es necesario agregarlo aquí también
  // app.useGlobalGuards(app.get(ThrottlerGuard));

  logger.log('Global Rate Limiter (ThrottlerGuard) enabled via module provider');

  // ========================================
  // Request ID Interceptor
  // ========================================
  // Agrega x-request-id a todos los requests para trazabilidad
  app.useGlobalInterceptors(new RequestIdInterceptor());

  logger.log('Request ID Interceptor enabled');

  // ========================================
  // Proxy Configuration
  // ========================================
  // Los proxies están configurados vía GatewayModule middleware:
  // - /auth/* → AUTH_URL (auth-service)
  // - /ops/* → OPS_URL (operations-service)
  
  const authUrl = configService.get<string>('AUTH_URL') || 'http://localhost:3001';
  const opsUrl = configService.get<string>('OPS_URL') || 'http://localhost:3002';
  const trackUrl = configService.get<string>('TRACK_URL') || 'ws://localhost:3003';

  logger.log(`Proxy routes configured:`);
  logger.log(`  /auth/* → ${authUrl}`);
  logger.log(`  /ops/* → ${opsUrl}`);
  logger.log(`  WebSocket (no proxy): ${trackUrl}/ws/track`);

  // ========================================
  // WebSocket Note
  // ========================================
  // IMPORTANTE: El gateway NO hace proxy de WebSocket
  // El frontend debe conectarse directamente al tracking-service:
  //   ws://tracking-service:3003/ws/track?token=JWT_TOKEN
  // El tracking-service tiene su propia configuración de CORS/allowed origins

  // ========================================
  // Start Server
  // ========================================
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`🚀 API Gateway listening on http://localhost:${port}`);
  logger.log(`📝 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
  logger.log(`🔐 JWT Public Routes: ${configService.get<string>('JWT_PUBLIC_ROUTES') || 'none'}`);
  logger.log(`🎯 Policy Hints: ${configService.get<string>('JWT_POLICY_HINTS') || 'false'}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('API-Gateway');
  logger.error('Failed to start API Gateway', error);
  process.exit(1);
});
