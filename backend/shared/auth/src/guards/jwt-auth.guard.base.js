"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuardBase = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_1 = require("@aaron/common");
class JwtAuthGuardBase {
    publicRoutes = [];
    secret;
    constructor(secret, publicRoutes = []) {
        this.secret = secret;
        this.publicRoutes = publicRoutes;
    }
    /**
     * Middleware para Express
     */
    middleware() {
        return (req, res, next) => {
            const url = req.originalUrl || req.url || '';
            // Permitir rutas públicas
            if (this.publicRoutes.some((p) => url.startsWith(p))) {
                return next();
            }
            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith('Bearer ')) {
                throw new common_1.UnauthorizedException('Missing Bearer token');
            }
            const token = auth.substring(7);
            try {
                const payload = jsonwebtoken_1.default.verify(token, this.secret);
                if (payload.type && payload.type !== 'access') {
                    throw new common_1.UnauthorizedException('Invalid token type');
                }
                req.user = payload;
                next();
            }
            catch (error) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
        };
    }
    /**
     * Verificar token y retornar payload
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secret);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
}
exports.JwtAuthGuardBase = JwtAuthGuardBase;
//# sourceMappingURL=jwt-auth.guard.base.js.map