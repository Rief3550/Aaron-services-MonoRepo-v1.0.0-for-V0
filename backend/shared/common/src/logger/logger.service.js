"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(context) {
        this.context = context;
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const context = this.context ? `[${this.context}]` : '';
        const logMessage = `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
        console[level](logMessage, ...args);
    }
    debug(message, ...args) {
        this.formatMessage('debug', message, ...args);
    }
    info(message, ...args) {
        this.formatMessage('info', message, ...args);
    }
    warn(message, ...args) {
        this.formatMessage('warn', message, ...args);
    }
    error(message, ...args) {
        this.formatMessage('error', message, ...args);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.service.js.map