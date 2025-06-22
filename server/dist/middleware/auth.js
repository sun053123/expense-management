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
const auth_schemas_1 = require("../validation/auth.schemas");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthMiddleware {
    constructor() {
        /**
         * Middleware to authenticate requests using JWT tokens
         *
         * This middleware:
         * 1. Extracts and validates the Authorization header
         * 2. Verifies the JWT token using the AuthService
         * 3. Attaches user information to the request object
         * 4. Handles authentication errors appropriately
         *
         * @param req - Express request object
         * @param res - Express response object
         * @param next - Express next function
         */
        this.authenticate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Authentication attempt for ${req.method} ${req.path}`);
                // Step 1: Extract and validate authorization header
                const authHeader = req.headers.authorization;
                const tokenExtractionResult = this.extractAndValidateToken(authHeader);
                if (!tokenExtractionResult.success) {
                    logger_1.default.warn(`Authentication failed - ${tokenExtractionResult.error}`);
                    res.status(401).json({
                        success: false,
                        error: tokenExtractionResult.error,
                    });
                    return;
                }
                // Step 2: Verify token and get user information
                const verificationResult = yield this.verifyTokenAndGetUser(tokenExtractionResult.token);
                if (!verificationResult.success) {
                    logger_1.default.warn(`Token verification failed - ${verificationResult.error}`);
                    res.status(401).json({
                        success: false,
                        error: verificationResult.error,
                    });
                    return;
                }
                // Step 3: Attach user to request object for downstream middleware/routes
                req.user = verificationResult.user;
                logger_1.default.debug(`Authentication successful for user ID: ${req.user.id}`);
                next();
            }
            catch (error) {
                logger_1.default.error("Unexpected error in authentication middleware:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error during authentication",
                });
            }
        });
        /**
         * Optional authentication middleware - doesn't fail if no token provided
         *
         * This middleware attempts authentication but continues processing even if
         * authentication fails. Useful for routes that can work with or without
         * authentication (e.g., public content with optional user-specific features).
         *
         * @param req - Express request object
         * @param res - Express response object
         * @param next - Express next function
         */
        this.optionalAuthenticate = (req, _res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Optional authentication attempt for ${req.method} ${req.path}`);
                const authHeader = req.headers.authorization;
                // Only attempt authentication if authorization header is present
                if (authHeader) {
                    const tokenExtractionResult = this.extractAndValidateToken(authHeader);
                    if (tokenExtractionResult.success) {
                        const verificationResult = yield this.verifyTokenAndGetUser(tokenExtractionResult.token);
                        if (verificationResult.success) {
                            req.user = verificationResult.user;
                            logger_1.default.debug(`Optional authentication successful for user ID: ${req.user.id}`);
                        }
                        else {
                            logger_1.default.debug(`Optional authentication failed - ${verificationResult.error}`);
                        }
                    }
                    else {
                        logger_1.default.debug(`Optional authentication failed - ${tokenExtractionResult.error}`);
                    }
                }
                else {
                    logger_1.default.debug("No authorization header provided for optional authentication");
                }
                // Always continue to next middleware regardless of authentication result
                next();
            }
            catch (error) {
                logger_1.default.error("Unexpected error in optional authentication middleware:", error);
                // Continue without authentication in case of errors
                next();
            }
        });
        this.authService = new AuthService_1.AuthService();
    }
    /**
     * Extract and validate token from Authorization header
     *
     * @param authHeader - Authorization header value
     * @returns Result with token or error message
     */
    extractAndValidateToken(authHeader) {
        if (!authHeader) {
            return {
                success: false,
                error: "Authorization header is required",
            };
        }
        // Use AuthValidation to extract and validate token
        const result = auth_schemas_1.AuthValidation.extractAndValidateToken(authHeader);
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Invalid authorization header format",
            };
        }
        return {
            success: true,
            token: result.token,
        };
    }
    /**
     * Verify token and get user information
     *
     * @param token - JWT token to verify
     * @returns Result with user data or error message
     */
    verifyTokenAndGetUser(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.authService.verifyToken(token);
                if (!result.success || !result.data) {
                    return {
                        success: false,
                        error: result.error || "Token verification failed",
                    };
                }
                return {
                    success: true,
                    user: result.data,
                };
            }
            catch (error) {
                logger_1.default.error("Error verifying token in middleware:", error);
                return {
                    success: false,
                    error: "Token verification failed",
                };
            }
        });
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Create singleton instance
const authMiddleware = new AuthMiddleware();
exports.authenticate = authMiddleware.authenticate;
exports.optionalAuthenticate = authMiddleware.optionalAuthenticate;
