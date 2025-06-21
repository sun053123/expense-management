import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import logger from '../utils/logger';
import { config } from '../config';

export const formatError = (error: GraphQLError): GraphQLFormattedError => {
  // Log the error
  logger.error('GraphQL Error:', {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: error.extensions,
  });

  // Handle different types of errors
  if (error.originalError instanceof AuthenticationError) {
    return {
      message: error.message,
      extensions: {
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      },
    };
  }

  if (error.originalError instanceof ForbiddenError) {
    return {
      message: error.message,
      extensions: {
        code: 'FORBIDDEN',
        statusCode: 403,
      },
    };
  }

  if (error.originalError instanceof UserInputError) {
    return {
      message: error.message,
      extensions: {
        code: 'BAD_USER_INPUT',
        statusCode: 400,
      },
    };
  }

  // Handle validation errors
  if (error.message.includes('validation')) {
    return {
      message: error.message,
      extensions: {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
    };
  }

  // Handle database errors
  if (error.message.includes('database') || error.message.includes('prisma')) {
    return {
      message: config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : error.message,
      extensions: {
        code: 'DATABASE_ERROR',
        statusCode: 500,
      },
    };
  }

  // Default error handling
  return {
    message: config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message,
    extensions: {
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(config.nodeEnv === 'development' && {
        stacktrace: error.stack?.split('\n'),
      }),
    },
  };
};
