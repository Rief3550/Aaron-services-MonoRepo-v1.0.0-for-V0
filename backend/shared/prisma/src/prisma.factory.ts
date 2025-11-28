// No importar tipos de @prisma/client directamente - cada servicio tiene su propio cliente
// Usar tipos genéricos que se resuelven en tiempo de compilación

import { loggingMiddleware } from './middleware/logging.middleware';

// Tipos genéricos para opciones de Prisma Client
export interface PrismaFactoryOptions {
  /**
   * Identificador del cliente (útil para cache por servicio)
   */
  name?: string;
  /**
   * Middlewares extra a registrar
   */
  middlewares?: Array<(params: any, next: any) => Promise<any>>;
  /**
   * URL de la base de datos
   */
  datasources?: {
    db?: {
      url?: string;
    };
  };
  /**
   * Opciones de logging
   */
  log?: Array<'query' | 'info' | 'warn' | 'error'>;
  /**
   * Otras opciones de Prisma Client
   */
  [key: string]: any;
}

export class PrismaFactory {
  private static clients = new Map<string, any>();
  private static shutdownHookRegistered = false;

  static createClient<T extends new (options: any) => any>(
    ClientConstructor: T,
    options: PrismaFactoryOptions = {},
  ): InstanceType<T> {
    const { name, middlewares = [], ...prismaOptions } = options;

    const cacheKey =
      name ||
      prismaOptions.datasources?.db?.url ||
      process.env.DATABASE_URL ||
      'default';

    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey) as InstanceType<T>;
    }

    const finalOptions: any = { ...prismaOptions };

    if (!finalOptions.log) {
      finalOptions.log =
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'];
    }

    if (!finalOptions.datasources?.db?.url && process.env.DATABASE_URL) {
      finalOptions.datasources = {
        ...(finalOptions.datasources ?? {}),
        db: {
          ...(finalOptions.datasources?.db ?? {}),
          url: process.env.DATABASE_URL,
        },
      };
    }

    const prisma = new ClientConstructor(finalOptions);

    const middlewareList = middlewares.length > 0 ? middlewares : [loggingMiddleware];
    middlewareList.forEach((middleware) => prisma.$use(middleware));

    this.clients.set(cacheKey, prisma);
    this.registerShutdownHook();

    return prisma as InstanceType<T>;
  }

  static async disconnectAll() {
    const disconnects = Array.from(this.clients.values()).map((client) => client.$disconnect());
    await Promise.all(disconnects);
    this.clients.clear();
    this.shutdownHookRegistered = false;
  }

  private static registerShutdownHook() {
    if (this.shutdownHookRegistered) {
      return;
    }

    this.shutdownHookRegistered = true;
    process.once('beforeExit', async () => {
      await PrismaFactory.disconnectAll();
    });
  }
}

