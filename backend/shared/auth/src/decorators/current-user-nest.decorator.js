"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
/**
 * @CurrentUser decorator for NestJS (empty stub)
 * To be implemented when migrating to NestJS
 */
const common_1 = require("@nestjs/common");
/**
 * Decorator to get current user from request
 * Usage: @CurrentUser() user: JwtPayload
 */
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
});
//# sourceMappingURL=current-user-nest.decorator.js.map