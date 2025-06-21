"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
const formatError = (error) => {
    var _a;
    // Log the error
    logger_1.default.error('GraphQL Error:', {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: error.extensions,
    });
    // Handle different types of errors
    if (error.originalError instanceof apollo_server_express_1.AuthenticationError) {
        return {
            message: error.message,
            extensions: {
                code: 'UNAUTHENTICATED',
                statusCode: 401,
            },
        };
    }
    if (error.originalError instanceof apollo_server_express_1.ForbiddenError) {
        return {
            message: error.message,
            extensions: {
                code: 'FORBIDDEN',
                statusCode: 403,
            },
        };
    }
    if (error.originalError instanceof apollo_server_express_1.UserInputError) {
        return {
            message: error.message,
            extensions: {
                code: 'BAD_USER_INPUT',
                statusCode: 400,
            },
        };
    }
    // Handle validation errors
    if (error.message.includes('validation')) {
        return {
            message: error.message,
            extensions: {
                code: 'VALIDATION_ERROR',
                statusCode: 400,
            },
        };
    }
    // Handle database errors
    if (error.message.includes('database') || error.message.includes('prisma')) {
        return {
            message: config_1.config.nodeEnv === 'production'
                ? 'Internal server error'
                : error.message,
            extensions: {
                code: 'DATABASE_ERROR',
                statusCode: 500,
            },
        };
    }
    // Default error handling
    return {
        message: config_1.config.nodeEnv === 'production'
            ? 'Internal server error'
            : error.message,
        extensions: Object.assign({ code: 'INTERNAL_ERROR', statusCode: 500 }, (config_1.config.nodeEnv === 'development' && {
            stacktrace: (_a = error.stack) === null || _a === void 0 ? void 0 : _a.split('\n'),
        })),
    };
};
exports.formatError = formatError;
