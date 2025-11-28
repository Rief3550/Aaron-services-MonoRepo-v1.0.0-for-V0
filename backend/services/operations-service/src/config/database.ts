/**
 * Configuración de Prisma Client
 */
import { Logger } from '@aaron/common';
import { PrismaFactory, loggingMiddleware } from '@aaron/prisma';
import { PrismaClient, Prisma } from '@aaron/prisma-client-ops';

const logger = new Logger('Prisma');

export const prisma = PrismaFactory.createClient(PrismaClient, {
  name: 'operations-service',
  middlewares: [loggingMiddleware],
}) as PrismaClient;

prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
  logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
});
