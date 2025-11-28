"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
class HttpExceptionFilter {
    getRequest(host) {
        const ctx = host.switchToHttp();
        return ctx.getRequest();
    }
    getResponse(host) {
        const ctx = host.switchToHttp();
        return ctx.getResponse();
    }
    sendErrorResponse(response, statusCode, message, error) {
        response.status(statusCode).json({
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            ...(error && process.env.NODE_ENV === 'development' && { error }),
        });
    }
}
exports.HttpExceptionFilter = HttpExceptionFilter;
//# sourceMappingURL=http-exception.filter.js.map