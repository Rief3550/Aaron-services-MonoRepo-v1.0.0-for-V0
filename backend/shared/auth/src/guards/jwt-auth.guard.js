"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_1 = require("@aaron/common");
class JwtAuthGuard {
    secret;
    publicRoutes;
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
                return next(new common_1.UnauthorizedException('Missing Bearer token'));
            }
            const token = auth.substring(7);
            try {
                const payload = jsonwebtoken_1.default.verify(token, this.secret);
                if (payload.type && payload.type !== 'access') {
                    return next(new common_1.UnauthorizedException('Invalid token type'));
                }
                // Normalizar userId/sub
                const userId = payload.userId || payload.sub;
                if (!userId) {
                    return next(new common_1.UnauthorizedException('Invalid token payload'));
                }
                req.user = {
                    ...payload,
                    userId,
                    sub: userId,
                };
                next();
            }
            catch (error) {
                return next(new common_1.UnauthorizedException('Invalid or expired token'));
            }
        };
    }
    /**
     * Verificar token y retornar payload
     */
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.secret);
            if (payload.type && payload.type !== 'access') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const userId = payload.userId || payload.sub;
            if (!userId) {
                throw new common_1.UnauthorizedException('Invalid token payload');
            }
            return {
                ...payload,
                userId,
                sub: userId,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    /**
     * Verificar token desde query string (útil para WebSocket)
     */
    verifyTokenFromQuery(token) {
        if (!token) {
            return null;
        }
        try {
            return this.verifyToken(token);
        }
        catch {
            return null;
        }
    }
}
exports.JwtAuthGuard = JwtAuthGuard;
//# sourceMappingURL=jwt-auth.guard.js.map