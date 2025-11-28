/**
 * Factory para crear instancias de Prisma Client
 * Cada servicio debe proporcionar su propio schema
 */
export interface PrismaClientOptions {
    schemaPath: string;
    logLevel?: 'query' | 'info' | 'warn' | 'error';
}
export declare class PrismaFactory {
    static createClient(options: PrismaClientOptions): {
        $connect: () => Promise<void>;
        $disconnect: () => Promise<void>;
    };
}
//# sourceMappingURL=prisma.factory.d.ts.map