import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { AuthValidation } from "../validation/auth.schemas";
import logger from "../utils/logger";

/**
 * Authentication Middleware
 *
 * This middleware provides authentication functionality for Express routes:
 * - JWT token validation and verification
 * - User authentication with comprehensive error handling
 * - Optional authentication for public routes
 * - Request context enhancement with user information
 *
 * The middleware integrates with the refactored authentication system using
 * Zod validation and raw PostgreSQL queries for optimal performance and security.
 */

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

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
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.debug(`Authentication attempt for ${req.method} ${req.path}`);

      // Step 1: Extract and validate authorization header
      const authHeader = req.headers.authorization;
      const tokenExtractionResult = this.extractAndValidateToken(authHeader);

      if (!tokenExtractionResult.success) {
        logger.warn(`Authentication failed - ${tokenExtractionResult.error}`);
        res.status(401).json({
          success: false,
          error: tokenExtractionResult.error,
        });
        return;
      }

      // Step 2: Verify token and get user information
      const verificationResult = await this.verifyTokenAndGetUser(
        tokenExtractionResult.token!
      );

      if (!verificationResult.success) {
        logger.warn(`Token verification failed - ${verificationResult.error}`);
        res.status(401).json({
          success: false,
          error: verificationResult.error,
        });
        return;
      }

      // Step 3: Attach user to request object for downstream middleware/routes
      req.user = verificationResult.user!;

      logger.debug(`Authentication successful for user ID: ${req.user.id}`);
      next();
    } catch (error) {
      logger.error("Unexpected error in authentication middleware:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during authentication",
      });
    }
  };

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
  optionalAuthenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.debug(
        `Optional authentication attempt for ${req.method} ${req.path}`
      );

      const authHeader = req.headers.authorization;

      // Only attempt authentication if authorization header is present
      if (authHeader) {
        const tokenExtractionResult = this.extractAndValidateToken(authHeader);

        if (tokenExtractionResult.success) {
          const verificationResult = await this.verifyTokenAndGetUser(
            tokenExtractionResult.token!
          );

          if (verificationResult.success) {
            req.user = verificationResult.user!;
            logger.debug(
              `Optional authentication successful for user ID: ${req.user.id}`
            );
          } else {
            logger.debug(
              `Optional authentication failed - ${verificationResult.error}`
            );
          }
        } else {
          logger.debug(
            `Optional authentication failed - ${tokenExtractionResult.error}`
          );
        }
      } else {
        logger.debug(
          "No authorization header provided for optional authentication"
        );
      }

      // Always continue to next middleware regardless of authentication result
      next();
    } catch (error) {
      logger.error(
        "Unexpected error in optional authentication middleware:",
        error
      );
      // Continue without authentication in case of errors
      next();
    }
  };

  /**
   * Extract and validate token from Authorization header
   *
   * @param authHeader - Authorization header value
   * @returns Result with token or error message
   */
  private extractAndValidateToken(authHeader?: string): {
    success: boolean;
    token?: string;
    error?: string;
  } {
    if (!authHeader) {
      return {
        success: false,
        error: "Authorization header is required",
      };
    }

    // Use AuthValidation to extract and validate token
    const result = AuthValidation.extractAndValidateToken(authHeader);

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
  private async verifyTokenAndGetUser(token: string): Promise<{
    success: boolean;
    user?: {
      id: number;
      email: string;
      createdAt: Date;
      updatedAt: Date;
    };
    error?: string;
  }> {
    try {
      const result = await this.authService.verifyToken(token);

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
    } catch (error) {
      logger.error("Error verifying token in middleware:", error);
      return {
        success: false,
        error: "Token verification failed",
      };
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
