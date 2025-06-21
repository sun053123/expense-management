"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = exports.AuthMiddleware = void 0;
const AuthService_1 = require("../services/AuthService");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthMiddleware {
    constructor() {
        /**
         * Middleware to authenticate requests using JWT tokens
         */
        this.authenticate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                const token = utils_1.AuthUtils.extractTokenFromHeader(authHeader);
                if (!token) {
                    res.status(401).json({
                        success: false,
                        error: 'Access token is required',
                    });
                    return;
                }
                const result = yield this.authService.verifyToken(token);
                if (!result.success || !result.data) {
                    res.status(401).json({
                        success: false,
                        error: result.error || 'Invalid token',
                    });
                    return;
                }
                // Attach user to request object
                req.user = result.data;
                next();
            }
            catch (error) {
                logger_1.default.error('Authentication middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                });
            }
        });
        /**
         * Optional authentication middleware - doesn't fail if no token provided
         */
        this.optionalAuthenticate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                const token = utils_1.AuthUtils.extractTokenFromHeader(authHeader);
                if (token) {
                    const result = yield this.authService.verifyToken(token);
                    if (result.success && result.data) {
                        req.user = result.data;
                    }
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Optional authentication middleware error:', error);
                // Continue without authentication
                next();
            }
        });
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Create singleton instance
const authMiddleware = new AuthMiddleware();
exports.authenticate = authMiddleware.authenticate;
exports.optionalAuthenticate = authMiddleware.optionalAuthenticate;
