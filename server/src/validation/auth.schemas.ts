import { z } from 'zod';

/**
 * Validation schemas for authentication-related operations
 * 
 * These schemas provide comprehensive input validation using Zod,
 * ensuring data integrity and security for authentication flows.
 */

// Email validation schema with comprehensive rules
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please provide a valid email address')
  .max(254, 'Email address is too long') // RFC 5321 limit
  .toLowerCase()
  .trim();

// Password validation schema with security requirements
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(128, 'Password must be less than 128 characters long')
  .refine(
    (password) => password.length > 0,
    'Password cannot be empty'
  );

// Enhanced password schema for registration (stricter requirements)
const registrationPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

// JWT token validation schema
const tokenSchema = z
  .string()
  .min(1, 'Token is required')
  .regex(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    'Invalid token format'
  );

/**
 * Login request validation schema
 * Validates email and password for user authentication
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Registration request validation schema
 * Validates email and password for new user creation
 * Uses stricter password requirements for security
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: registrationPasswordSchema,
});

/**
 * Token verification request validation schema
 * Validates JWT token format and presence
 */
export const tokenVerificationSchema = z.object({
  token: tokenSchema,
});

/**
 * Password reset request validation schema
 * Validates email for password reset functionality
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation validation schema
 * Validates token and new password for password reset completion
 */
export const passwordResetConfirmSchema = z.object({
  token: tokenSchema,
  newPassword: registrationPasswordSchema,
});

/**
 * User ID validation schema
 * Validates user ID for database operations
 */
export const userIdSchema = z
  .number()
  .int('User ID must be an integer')
  .positive('User ID must be positive');

/**
 * Authorization header validation schema
 * Validates Bearer token format in Authorization header
 */
export const authHeaderSchema = z
  .string()
  .regex(
    /^Bearer [A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    'Invalid authorization header format. Expected: Bearer <token>'
  );

// Type exports for TypeScript integration
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TokenVerificationInput = z.infer<typeof tokenVerificationSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
export type AuthHeaderInput = z.infer<typeof authHeaderSchema>;

/**
 * Validation helper functions
 */
export class AuthValidation {
  /**
   * Validates login input and returns parsed data or validation errors
   */
  static validateLogin(input: unknown) {
    return loginSchema.safeParse(input);
  }

  /**
   * Validates registration input and returns parsed data or validation errors
   */
  static validateRegister(input: unknown) {
    return registerSchema.safeParse(input);
  }

  /**
   * Validates token and returns parsed data or validation errors
   */
  static validateToken(input: unknown) {
    return tokenVerificationSchema.safeParse(input);
  }

  /**
   * Validates password reset request and returns parsed data or validation errors
   */
  static validatePasswordResetRequest(input: unknown) {
    return passwordResetRequestSchema.safeParse(input);
  }

  /**
   * Validates password reset confirmation and returns parsed data or validation errors
   */
  static validatePasswordResetConfirm(input: unknown) {
    return passwordResetConfirmSchema.safeParse(input);
  }

  /**
   * Validates user ID and returns parsed data or validation errors
   */
  static validateUserId(input: unknown) {
    return userIdSchema.safeParse(input);
  }

  /**
   * Validates authorization header and returns parsed data or validation errors
   */
  static validateAuthHeader(input: unknown) {
    return authHeaderSchema.safeParse(input);
  }

  /**
   * Extracts and validates token from Authorization header
   */
  static extractAndValidateToken(authHeader?: string): { success: boolean; token?: string; error?: string } {
    if (!authHeader) {
      return { success: false, error: 'Authorization header is required' };
    }

    const headerValidation = this.validateAuthHeader(authHeader);
    if (!headerValidation.success) {
      return { 
        success: false, 
        error: headerValidation.error.errors[0]?.message || 'Invalid authorization header' 
      };
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    return { success: true, token };
  }

  /**
   * Formats Zod validation errors into user-friendly messages
   */
  static formatValidationErrors(errors: z.ZodError): string[] {
    return errors.errors.map(error => {
      const path = error.path.length > 0 ? `${error.path.join('.')}: ` : '';
      return `${path}${error.message}`;
    });
  }

  /**
   * Creates a standardized validation error response
   */
  static createValidationErrorResponse(errors: z.ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      details: this.formatValidationErrors(errors),
    };
  }
}
