"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = loggingMiddleware;
/**
 * Middleware de logging para Prisma
 */
function loggingMiddleware(params, next) {
    const before = Date.now();
    return next(params).then((result) => {
        const after = Date.now();
        console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
        return result;
    });
}
//# sourceMappingURL=logging.middleware.js.map