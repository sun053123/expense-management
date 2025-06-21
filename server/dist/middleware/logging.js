"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    logger_1.default.http(`${req.method} ${req.url} - ${req.ip}`);
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        logger_1.default.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        // Call original end method
        originalEnd.call(this, chunk, encoding);
        return this;
    };
    next();
};
exports.requestLogger = requestLogger;
