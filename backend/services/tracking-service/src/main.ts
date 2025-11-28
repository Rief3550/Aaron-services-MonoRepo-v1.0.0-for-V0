import { createGlobalValidationPipe , Logger } from '@aaron/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('TrackingService');

  // CORS - WebSocket compatible
  const allowedOrigins = process.env.WS_ALLOWED_ORIGINS?.split(',') || ['*'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global ValidationPipe
  app.useGlobalPipes(createGlobalValidationPipe());

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.info(`🚀 Tracking Service running on port ${port}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔌 WebSocket available at ws://localhost:${port}/ws/track`);
}

bootstrap().catch((error) => {
  console.error('Failed to start service', error);
  process.exit(1);
});
