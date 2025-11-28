"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = void 0;
/**
 * Helpers para IDs
 */
const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
exports.generateId = generateId;
//# sourceMappingURL=id.helper.js.map