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
exports.AuthUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const auth_schemas_1 = require("../validation/auth.schemas");
const logger_1 = __importDefault(require("./logger"));
/**
 * AuthUtils - Authentication utility functions
 *
 * This utility class provides secure authentication operations including:
 * - Password hashing and verification using bcrypt
 * - JWT token generation and verification
 * - Input validation using Zod schemas
 * - Authorization header parsing
 *
 * All methods are designed with security best practices and comprehensive error handling.
 */
class AuthUtils {
    /**
     * Hash a password using bcrypt with secure salt rounds
     *
     * Uses 12 salt rounds for optimal security vs performance balance.
     * Higher rounds provide better security but slower hashing.
     *
     * @param password - Plain text password to hash
     * @returns Promise resolving to hashed password
     */
    static hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate password before hashing (using basic validation to avoid circular dependency)
                if (!password || password.length < 6 || password.length > 128) {
                    throw new Error("Password must be between 6 and 128 characters");
                }
                const saltRounds = 12;
                const hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
                logger_1.default.debug("Password hashed successfully");
                return hashedPassword;
            }
            catch (error) {
                logger_1.default.error("Error hashing password:", error);
                throw error;
            }
        });
    }
    /**
     * Compare a plain text password with a hashed password
     *
     * Uses bcrypt's secure comparison to prevent timing attacks.
     *
     * @param password - Plain text password to verify
     * @param hashedPassword - Hashed password from database
     * @returns Promise resolving to true if passwords match
     */
    static comparePassword(password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!password || !hashedPassword) {
                    logger_1.default.warn("Password comparison attempted with empty values");
                    return false;
                }
                const isMatch = yield bcryptjs_1.default.compare(password, hashedPassword);
                if (isMatch) {
                    logger_1.default.debug("Password comparison successful");
                }
                else {
                    logger_1.default.debug("Password comparison failed");
                }
                return isMatch;
            }
            catch (error) {
                logger_1.default.error("Error comparing passwords:", error);
                return false;
            }
        });
    }
    /**
     * Generate a JWT token for authenticated user
     *
     * Creates a secure JWT token with user information and expiration.
     * Token includes user ID and email for identification.
     *
     * @param user - User object without password
     * @returns Signed JWT token string
     */
    static generateToken(user) {
        try {
            // Basic validation for user data
            if (!user.id || !user.email) {
                throw new Error("Invalid user data for token generation");
            }
            const payload = {
                id: user.id,
                email: user.email,
                iat: Math.floor(Date.now() / 1000), // Issued at time
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
                expiresIn: config_1.config.jwt.expiresIn,
                issuer: "expense-management-api",
                audience: "expense-management-client",
            });
            logger_1.default.debug(`JWT token generated for user ID: ${user.id}`);
            return token;
        }
        catch (error) {
            logger_1.default.error("Error generating JWT token:", error);
            throw new Error("Failed to generate authentication token");
        }
    }
    /**
     * Verify and decode a JWT token
     *
     * Validates token signature, expiration, and format.
     * Returns decoded payload if valid, null if invalid.
     *
     * @param token - JWT token string to verify
     * @returns Decoded token payload or null if invalid
     */
    static verifyToken(token) {
        try {
            // Basic token format validation
            if (!token || typeof token !== "string") {
                logger_1.default.debug("Invalid token format");
                return null;
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
                issuer: "expense-management-api",
                audience: "expense-management-client",
            });
            // Validate decoded payload structure
            if (!decoded.id || !decoded.email) {
                logger_1.default.warn("Token payload missing required fields");
                return null;
            }
            logger_1.default.debug(`Token verified successfully for user ID: ${decoded.id}`);
            return {
                id: decoded.id,
                email: decoded.email,
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger_1.default.debug("Token has expired");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger_1.default.debug("Invalid token signature or format");
            }
            else {
                logger_1.default.error("Unexpected error verifying token:", error);
            }
            return null;
        }
    }
    /**
     * Extract and validate token from Authorization header
     *
     * Parses Bearer token from Authorization header and validates format.
     *
     * @param authHeader - Authorization header value
     * @returns Extracted token string or null if invalid
     */
    static extractTokenFromHeader(authHeader) {
        try {
            if (!authHeader) {
                logger_1.default.debug("No authorization header provided");
                return null;
            }
            // Use Zod validation for header format
            const result = auth_schemas_1.AuthValidation.extractAndValidateToken(authHeader);
            if (!result.success) {
                logger_1.default.debug(`Authorization header validation failed: ${result.error}`);
                return null;
            }
            logger_1.default.debug("Token extracted successfully from authorization header");
            return result.token || null;
        }
        catch (error) {
            logger_1.default.error("Error extracting token from header:", error);
            return null;
        }
    }
    /**
     * Validate email format using Zod schema
     *
     * @param email - Email address to validate
     * @returns true if email is valid, false otherwise
     */
    static isValidEmail(email) {
        try {
            const validation = auth_schemas_1.AuthValidation.validateLogin({
                email,
                password: "temppass", // Use valid password length for login schema (6+ chars)
            });
            return validation.success;
        }
        catch (error) {
            logger_1.default.debug("Email validation error:", error);
            return false;
        }
    }
    /**
     * Validate password strength using Zod schema
     *
     * @param password - Password to validate
     * @returns Validation result with success status and message
     */
    static isValidPassword(password) {
        try {
            const validation = auth_schemas_1.AuthValidation.validateRegister({
                email: "temp@example.com",
                password,
            });
            if (validation.success) {
                return { valid: true };
            }
            // Extract password-specific error message
            const passwordError = validation.error.errors.find((error) => error.path.includes("password"));
            return {
                valid: false,
                message: (passwordError === null || passwordError === void 0 ? void 0 : passwordError.message) || "Invalid password",
            };
        }
        catch (error) {
            logger_1.default.debug("Password validation error:", error);
            return {
                valid: false,
                message: "Password validation failed",
            };
        }
    }
    /**
     * Generate a secure random token for password reset or email verification
     *
     * @param length - Length of the token (default: 32)
     * @returns Random token string
     */
    static generateSecureToken(length = 32) {
        try {
            const crypto = require("crypto");
            return crypto.randomBytes(length).toString("hex");
        }
        catch (error) {
            logger_1.default.error("Error generating secure token:", error);
            throw new Error("Failed to generate secure token");
        }
    }
    /**
     * Check if a JWT token is expired without verifying signature
     * Useful for providing better error messages
     *
     * @param token - JWT token to check
     * @returns true if token is expired, false otherwise
     */
    static isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            logger_1.default.debug("Error checking token expiration:", error);
            return true;
        }
    }
}
exports.AuthUtils = AuthUtils;
