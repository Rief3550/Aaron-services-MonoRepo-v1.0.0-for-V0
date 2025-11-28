"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalValidationPipe = createGlobalValidationPipe;
/**
 * ValidationPipe global factory for NestJS
 * Creates a configured ValidationPipe instance with common settings
 */
const common_1 = require("@nestjs/common");
function createGlobalValidationPipe(options) {
    return new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: {
            enableImplicitConversion: true,
        },
        ...options,
    });
}
//# sourceMappingURL=validation-pipe.factory.js.map