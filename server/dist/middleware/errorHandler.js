"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    // Log error
    logger_1.default.error(`Error ${statusCode}: ${message}`, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        stack: error.stack,
    });
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal Server Error';
    }
    res.status(statusCode).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === 'development' && { stack: error.stack })));
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
