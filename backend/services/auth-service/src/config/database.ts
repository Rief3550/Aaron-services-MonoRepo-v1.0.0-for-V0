import { PrismaFactory, loggingMiddleware } from '@aaron/prisma';
import { PrismaClient } from '@aaron/prisma-client-auth';

export const prisma = PrismaFactory.createClient(PrismaClient, {
  name: 'auth-service',
  middlewares: [loggingMiddleware],
}) as PrismaClient;

