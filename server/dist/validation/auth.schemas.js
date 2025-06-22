"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = exports.authHeaderSchema = exports.userIdSchema = exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.tokenVerificationSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
/**
 * Validation schemas for authentication-related operations
 *
 * These schemas provide comprehensive input validation using Zod,
 * ensuring data integrity and security for authentication flows.
 */
// Email validation schema with comprehensive rules
const emailSchema = zod_1.z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .max(254, 'Email address is too long') // RFC 5321 limit
    .toLowerCase()
    .trim();
// Password validation schema with security requirements
const passwordSchema = zod_1.z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be less than 128 characters long')
    .refine((password) => password.length > 0, 'Password cannot be empty');
// Enhanced password schema for registration (stricter requirements)
const registrationPasswordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
// JWT token validation schema
const tokenSchema = zod_1.z
    .string()
    .min(1, 'Token is required')
    .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'Invalid token format');
/**
 * Login request validation schema
 * Validates email and password for user authentication
 */
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
});
/**
 * Registration request validation schema
 * Validates email and password for new user creation
 * Uses stricter password requirements for security
 */
exports.registerSchema = zod_1.z.object({
    email: emailSchema,
    password: registrationPasswordSchema,
});
/**
 * Token verification request validation schema
 * Validates JWT token format and presence
 */
exports.tokenVerificationSchema = zod_1.z.object({
    token: tokenSchema,
});
/**
 * Password reset request validation schema
 * Validates email for password reset functionality
 */
exports.passwordResetRequestSchema = zod_1.z.object({
    email: emailSchema,
});
/**
 * Password reset confirmation validation schema
 * Validates token and new password for password reset completion
 */
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: tokenSchema,
    newPassword: registrationPasswordSchema,
});
/**
 * User ID validation schema
 * Validates user ID for database operations
 */
exports.userIdSchema = zod_1.z
    .number()
    .int('User ID must be an integer')
    .positive('User ID must be positive');
/**
 * Authorization header validation schema
 * Validates Bearer token format in Authorization header
 */
exports.authHeaderSchema = zod_1.z
    .string()
    .regex(/^Bearer [A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'Invalid authorization header format. Expected: Bearer <token>');
/**
 * Validation helper functions
 */
class AuthValidation {
    /**
     * Validates login input and returns parsed data or validation errors
     */
    static validateLogin(input) {
        return exports.loginSchema.safeParse(input);
    }
    /**
     * Validates registration input and returns parsed data or validation errors
     */
    static validateRegister(input) {
        return exports.registerSchema.safeParse(input);
    }
    /**
     * Validates token and returns parsed data or validation errors
     */
    static validateToken(input) {
        return exports.tokenVerificationSchema.safeParse(input);
    }
    /**
     * Validates password reset request and returns parsed data or validation errors
     */
    static validatePasswordResetRequest(input) {
        return exports.passwordResetRequestSchema.safeParse(input);
    }
    /**
     * Validates password reset confirmation and returns parsed data or validation errors
     */
    static validatePasswordResetConfirm(input) {
        return exports.passwordResetConfirmSchema.safeParse(input);
    }
    /**
     * Validates user ID and returns parsed data or validation errors
     */
    static validateUserId(input) {
        return exports.userIdSchema.safeParse(input);
    }
    /**
     * Validates authorization header and returns parsed data or validation errors
     */
    static validateAuthHeader(input) {
        return exports.authHeaderSchema.safeParse(input);
    }
    /**
     * Extracts and validates token from Authorization header
     */
    static extractAndValidateToken(authHeader) {
        var _a;
        if (!authHeader) {
            return { success: false, error: 'Authorization header is required' };
        }
        const headerValidation = this.validateAuthHeader(authHeader);
        if (!headerValidation.success) {
            return {
                success: false,
                error: ((_a = headerValidation.error.errors[0]) === null || _a === void 0 ? void 0 : _a.message) || 'Invalid authorization header'
            };
        }
        // Extract token from "Bearer <token>" format
        const token = authHeader.split(' ')[1];
        return { success: true, token };
    }
    /**
     * Formats Zod validation errors into user-friendly messages
     */
    static formatValidationErrors(errors) {
        return errors.errors.map(error => {
            const path = error.path.length > 0 ? `${error.path.join('.')}: ` : '';
            return `${path}${error.message}`;
        });
    }
    /**
     * Creates a standardized validation error response
     */
    static createValidationErrorResponse(errors) {
        return {
            success: false,
            error: 'Validation failed',
            details: this.formatValidationErrors(errors),
        };
    }
}
exports.AuthValidation = AuthValidation;
