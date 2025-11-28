"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
/**
 * Filtro global para manejo de excepciones
 */
class GlobalExceptionFilter {
    catch(exception) {
        // Implementación del filtro de excepciones global
        console.error('GlobalExceptionFilter:', exception);
        return {
            statusCode: 500,
            message: 'Internal server error'
        };
    }
}
exports.GlobalExceptionFilter = GlobalExceptionFilter;
//# sourceMappingURL=global-exception.filter.js.map