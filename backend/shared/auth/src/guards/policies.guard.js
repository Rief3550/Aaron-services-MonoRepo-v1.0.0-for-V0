"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesGuard = void 0;
const common_1 = require("@aaron/common");
class PoliciesGuard {
    policies;
    casbinEnabled = false;
    constructor(policies = []) {
        this.policies = policies;
    }
    /**
     * Habilitar Casbin (cuando se implemente)
     */
    enableCasbin(enabled = true) {
        this.casbinEnabled = enabled;
        return this;
    }
    /**
     * Middleware para Express
     */
    middleware() {
        return async (req, res, next) => {
            if (!req.user) {
                return next(new common_1.ForbiddenException('User not authenticated'));
            }
            // Si Casbin está habilitado, usar CasbinHelper
            if (this.casbinEnabled) {
                try {
                    // TODO: Implementar con CasbinHelper de libs/auth/src/rbac
                    // const casbinHelper = new CasbinHelper();
                    // const allowed = await casbinHelper.checkPermission(...);
                    // if (!allowed) {
                    //   return next(new ForbiddenException('Policy check failed'));
                    // }
                    next();
                }
                catch (error) {
                    return next(new common_1.ForbiddenException('Policy check error'));
                }
            }
            // Validación básica con políticas estáticas
            const userRoles = req.user.roles || [];
            const userId = req.user.userId || req.user.sub || '';
            // Verificar si alguna política permite el acceso
            const allowed = this.policies.some((policy) => {
                // Verificar por rol
                if (policy.subject && userRoles.includes(policy.subject)) {
                    return true;
                }
                // Verificar por userId
                if (policy.subject === userId) {
                    return true;
                }
                return false;
            });
            if (!allowed && this.policies.length > 0) {
                return next(new common_1.ForbiddenException('Policy check failed'));
            }
            next();
        };
    }
    /**
     * Factory para crear guard con política específica
     */
    static requirePolicy(subject, object, action) {
        return new PoliciesGuard([{ subject, object, action }]);
    }
}
exports.PoliciesGuard = PoliciesGuard;
//# sourceMappingURL=policies.guard.js.map