"use strict";
/**
 * Decorator @CurrentUser - Obtiene el usuario actual del contexto
 * Para servicios Express (helper function, no decorator real)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.getCurrentUserId = getCurrentUserId;
exports.getCurrentUserRoles = getCurrentUserRoles;
exports.hasRole = hasRole;
exports.hasAnyRole = hasAnyRole;
exports.hasAllRoles = hasAllRoles;
/**
 * Obtiene el usuario actual del request
 * Extrae sub/userId y roles del JWT
 */
function getCurrentUser(req) {
    return req.user || null;
}
/**
 * Helper para obtener el userId (sub) del request
 */
function getCurrentUserId(req) {
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    const userId = req.user.userId || req.user.sub;
    if (!userId) {
        throw new Error('User ID not found in token');
    }
    return userId;
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
    return roles.some((role) => hasRole(req, role));
}
/**
 * Verifica si el usuario tiene todos los roles
 */
function hasAllRoles(req, roles) {
    return roles.every((role) => hasRole(req, role));
}
//# sourceMappingURL=current-user.decorator.js.map