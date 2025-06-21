import { Request } from 'express';
import { AuthService } from '../services';
import { AuthUtils } from '../utils';
import { GraphQLContext } from '../types';
import logger from '../utils/logger';

const authService = new AuthService();

export const createContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const context: GraphQLContext = {};

  try {
    // Extract token from request headers
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (token) {
      // Verify token and get user
      const result = await authService.verifyToken(token);
      
      if (result.success && result.data) {
        context.user = result.data;
        context.token = token;
      }
    }
  } catch (error) {
    // Log error but don't throw - allow unauthenticated requests
    logger.warn('Context creation error:', error);
  }

  return context;
};
