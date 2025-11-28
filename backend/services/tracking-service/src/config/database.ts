/**
 * Configuración de Prisma Client
 */
import { Logger } from '@aaron/common';
import { PrismaFactory, loggingMiddleware } from '@aaron/prisma';
import { PrismaClient } from '@aaron/prisma-client-tracking';

const logger = new Logger('Prisma');

export const prisma = PrismaFactory.createClient(PrismaClient, {
  name: 'tracking-service',
  middlewares: [loggingMiddleware],
}) as PrismaClient;

prisma.$on('query' as never, (e: any) => {
  logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
});
