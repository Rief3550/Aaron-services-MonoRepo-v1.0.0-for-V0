import { createGlobalValidationPipe , Logger } from '@aaron/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory , APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('AuthService');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Global ValidationPipe
  app.useGlobalPipes(createGlobalValidationPipe());

  // Global Rate Limiter (ThrottlerGuard)
  // Configurado en AppModule con ThrottlerModule

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.info(`🚀 Auth Service running on port ${port}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start service', error);
  process.exit(1);
});
