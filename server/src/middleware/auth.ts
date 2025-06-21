import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthUtils } from '../utils';
import logger from '../utils/logger';

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
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Access token is required',
        });
        return;
      }

      const result = await this.authService.verifyToken(token);

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
    } catch (error) {
      logger.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractTokenFromHeader(authHeader);

      if (token) {
        const result = await this.authService.verifyToken(token);
        if (result.success && result.data) {
          req.user = result.data;
        }
      }

      next();
    } catch (error) {
      logger.error('Optional authentication middleware error:', error);
      // Continue without authentication
      next();
    }
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
