"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@aaron/common");
class RolesGuard {
    allowedRoles;
    constructor(...allowedRoles) {
        this.allowedRoles = allowedRoles;
    }
    /**
     * Middleware para Express
     */
    middleware() {
        return (req, res, next) => {
            if (!req.user) {
                return next(new common_1.ForbiddenException('User not authenticated'));
            }
            const userRoles = req.user.roles || [];
            const hasRole = this.allowedRoles.some((role) => userRoles.includes(role));
            if (!hasRole) {
                return next(new common_1.ForbiddenException(`Insufficient permissions. Required roles: ${this.allowedRoles.join(', ')}`));
            }
            next();
        };
    }
    /**
     * Factory para crear guard con roles específicos
     */
    static require(...roles) {
        return new RolesGuard(...roles);
    }
    /**
     * Verificar si usuario tiene rol
     */
    static hasRole(user, role) {
        return (user.roles || []).includes(role);
    }
    /**
     * Verificar si usuario tiene alguno de los roles
     */
    static hasAnyRole(user, roles) {
        return roles.some((role) => this.hasRole(user, role));
    }
    /**
     * Verificar si usuario tiene todos los roles
     */
    static hasAllRoles(user, roles) {
        return roles.every((role) => this.hasRole(user, role));
    }
}
exports.RolesGuard = RolesGuard;
//# sourceMappingURL=roles.guard.js.map