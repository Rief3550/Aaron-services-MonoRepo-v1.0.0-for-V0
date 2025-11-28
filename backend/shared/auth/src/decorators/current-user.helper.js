"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.getCurrentUserId = getCurrentUserId;
exports.getCurrentUserRoles = getCurrentUserRoles;
exports.hasRole = hasRole;
exports.hasAnyRole = hasAnyRole;
/**
 * Obtiene el usuario actual del request
 */
function getCurrentUser(req) {
    return req.user || null;
}
/**
 * Obtiene el userId del request (lanza error si no está autenticado)
 */
function getCurrentUserId(req) {
    if (!req.user || !req.user.userId) {
        throw new Error('User not authenticated');
    }
    return req.user.userId;
}
/**
 * Obtiene los roles del usuario actual
 */
function getCurrentUserRoles(req) {
    return req.user?.roles || [];
}
/**
 * Verifica si el usuario tiene un rol específico
 */
function hasRole(req, role) {
    return (req.user?.roles || []).includes(role);
}
/**
 * Verifica si el usuario tiene alguno de los roles
 */
function hasAnyRole(req, roles) {
    return roles.some((role) => (req.user?.roles || []).includes(role));
}
//# sourceMappingURL=current-user.helper.js.map