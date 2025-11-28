"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = void 0;
exports.requireRoles = requireRoles;
/**
 * Roles Decorator - Para usar en Express como helper
 * Define roles requeridos y crea un middleware
 */
const roles_guard_1 = require("../guards/roles.guard");
/**
 * Helper para crear middleware de roles
 * Uso: app.use('/admin', requireRoles('ADMIN'))
 */
function requireRoles(...roles) {
    return new roles_guard_1.RolesGuard(...roles).middleware();
}
/**
 * Alias más corto
 */
exports.Roles = requireRoles;
//# sourceMappingURL=roles.decorator.js.map