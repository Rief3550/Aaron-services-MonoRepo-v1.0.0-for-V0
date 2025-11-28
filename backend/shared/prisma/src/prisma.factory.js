"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaFactory = void 0;
class PrismaFactory {
    static createClient(options) {
        // Implementación del factory de Prisma
        // Cada servicio carga su propio schema desde options.schemaPath
        // return new PrismaClient({ ... });
        // Placeholder
        return {
            $connect: async () => { },
            $disconnect: async () => { },
        };
    }
}
exports.PrismaFactory = PrismaFactory;
//# sourceMappingURL=prisma.factory.js.map