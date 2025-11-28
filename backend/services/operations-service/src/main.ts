import { createGlobalValidationPipe , Logger } from '@aaron/common';
import { NestFactory , APP_FILTER } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('OperationsService');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Global ValidationPipe
  app.useGlobalPipes(createGlobalValidationPipe());

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.info(`🚀 Operations Service running on port ${port}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start service', error);
  process.exit(1);
});
