"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteMiddleware = softDeleteMiddleware;
/**
 * Middleware para soft delete
 */
function softDeleteMiddleware(params, next) {
    // Implementación de soft delete
    // Si la acción es delete, cambiar a update con deletedAt
    if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { ...params.args.data, deletedAt: new Date() };
    }
    if (params.action === 'findMany' || params.action === 'findFirst') {
        if (!params.args.where) {
            params.args.where = {};
        }
        params.args.where.deletedAt = null;
    }
    return next(params);
}
//# sourceMappingURL=soft-delete.middleware.js.map