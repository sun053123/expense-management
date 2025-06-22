import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config";
import { User } from "../types";
import { AuthValidation } from "../validation/auth.schemas";
import logger from "./logger";

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
export class AuthUtils {
  /**
   * Hash a password using bcrypt with secure salt rounds
   *
   * Uses 12 salt rounds for optimal security vs performance balance.
   * Higher rounds provide better security but slower hashing.
   *
   * @param password - Plain text password to hash
   * @returns Promise resolving to hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // Validate password before hashing (using basic validation to avoid circular dependency)
      if (!password || password.length < 6 || password.length > 128) {
        throw new Error("Password must be between 6 and 128 characters");
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      logger.debug("Password hashed successfully");
      return hashedPassword;
    } catch (error) {
      logger.error("Error hashing password:", error);
      throw error;
    }
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
  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      if (!password || !hashedPassword) {
        logger.warn("Password comparison attempted with empty values");
        return false;
      }

      const isMatch = await bcrypt.compare(password, hashedPassword);

      if (isMatch) {
        logger.debug("Password comparison successful");
      } else {
        logger.debug("Password comparison failed");
      }

      return isMatch;
    } catch (error) {
      logger.error("Error comparing passwords:", error);
      return false;
    }
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
  static generateToken(user: Omit<User, "password">): string {
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

      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: "expense-management-api",
        audience: "expense-management-client",
      } as jwt.SignOptions);

      logger.debug(`JWT token generated for user ID: ${user.id}`);
      return token;
    } catch (error) {
      logger.error("Error generating JWT token:", error);
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
  static verifyToken(token: string): { id: number; email: string } | null {
    try {
      // Basic token format validation
      if (!token || typeof token !== "string") {
        logger.debug("Invalid token format");
        return null;
      }

      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: "expense-management-api",
        audience: "expense-management-client",
      }) as {
        id: number;
        email: string;
        iat: number;
        exp: number;
      };

      // Validate decoded payload structure
      if (!decoded.id || !decoded.email) {
        logger.warn("Token payload missing required fields");
        return null;
      }

      logger.debug(`Token verified successfully for user ID: ${decoded.id}`);
      return {
        id: decoded.id,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug("Token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug("Invalid token signature or format");
      } else {
        logger.error("Unexpected error verifying token:", error);
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
  static extractTokenFromHeader(authHeader?: string): string | null {
    try {
      if (!authHeader) {
        logger.debug("No authorization header provided");
        return null;
      }

      // Use Zod validation for header format
      const result = AuthValidation.extractAndValidateToken(authHeader);

      if (!result.success) {
        logger.debug(`Authorization header validation failed: ${result.error}`);
        return null;
      }

      logger.debug("Token extracted successfully from authorization header");
      return result.token || null;
    } catch (error) {
      logger.error("Error extracting token from header:", error);
      return null;
    }
  }

  /**
   * Validate email format using Zod schema
   *
   * @param email - Email address to validate
   * @returns true if email is valid, false otherwise
   */
  static isValidEmail(email: string): boolean {
    try {
      const validation = AuthValidation.validateLogin({
        email,
        password: "temppass", // Use valid password length for login schema (6+ chars)
      });
      return validation.success;
    } catch (error) {
      logger.debug("Email validation error:", error);
      return false;
    }
  }

  /**
   * Validate password strength using Zod schema
   *
   * @param password - Password to validate
   * @returns Validation result with success status and message
   */
  static isValidPassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    try {
      const validation = AuthValidation.validateRegister({
        email: "temp@example.com",
        password,
      });

      if (validation.success) {
        return { valid: true };
      }

      // Extract password-specific error message
      const passwordError = validation.error.errors.find((error) =>
        error.path.includes("password")
      );

      return {
        valid: false,
        message: passwordError?.message || "Invalid password",
      };
    } catch (error) {
      logger.debug("Password validation error:", error);
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
  static generateSecureToken(length: number = 32): string {
    try {
      const crypto = require("crypto");
      return crypto.randomBytes(length).toString("hex");
    } catch (error) {
      logger.error("Error generating secure token:", error);
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
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      logger.debug("Error checking token expiration:", error);
      return true;
    }
  }
}
