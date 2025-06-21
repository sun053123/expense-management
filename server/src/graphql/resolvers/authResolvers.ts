import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { AuthService } from '../../services';
import { GraphQLContext, LoginInput, RegisterInput } from '../../types';
import logger from '../../utils/logger';

const authService = new AuthService();

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }
      return context.user;
    },

    health: () => {
      return 'Server is running!';
    },
  },

  Mutation: {
    login: async (_: any, { input }: { input: LoginInput }) => {
      try {
        const result = await authService.login(input.email, input.password);
        
        if (!result.success) {
          throw new AuthenticationError(result.error || 'Login failed');
        }

        return result.data;
      } catch (error) {
        logger.error('Login resolver error:', error);
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('An error occurred during login');
      }
    },

    register: async (_: any, { input }: { input: RegisterInput }) => {
      try {
        const result = await authService.register(input.email, input.password);
        
        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }

        return result.data;
      } catch (error) {
        logger.error('Register resolver error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An error occurred during registration');
      }
    },
  },
};
