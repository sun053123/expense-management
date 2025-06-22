import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { AuthService } from "../../services";
import { GraphQLContext, LoginInput, RegisterInput } from "../../types";
import { AuthValidation } from "../../validation/auth.schemas";
import logger from "../../utils/logger";

/**
 * GraphQL Authentication Resolvers
 *
 * These resolvers handle authentication-related GraphQL operations:
 * - User login with comprehensive validation
 * - User registration with enhanced security
 * - Current user information retrieval
 * - Health check endpoint
 *
 * All resolvers include proper error handling, input validation using Zod schemas,
 * and comprehensive logging for security monitoring.
 */

const authService = new AuthService();

export const authResolvers = {
  Query: {
    /**
     * Get current authenticated user information
     *
     * This resolver returns the current user's information based on the
     * authentication context. It requires a valid JWT token in the request.
     *
     * @param context - GraphQL context containing user information
     * @returns Current user data without sensitive information
     */
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to me query");
        throw new AuthenticationError(
          "You must be logged in to access this resource"
        );
      }

      logger.debug(`User ${context.user.id} accessed me query`);
      return context.user;
    },

    /**
     * Health check endpoint
     *
     * Simple endpoint to verify the GraphQL server is running.
     * Used for monitoring and load balancer health checks.
     *
     * @returns Health status message
     */
    health: () => {
      logger.debug("Health check endpoint accessed");
      return "Server is running!";
    },
  },

  Mutation: {
    /**
     * User login mutation
     *
     * Authenticates a user with email and password, returning a JWT token
     * and user information upon successful authentication.
     *
     * @param input - Login credentials (email and password)
     * @returns Authentication payload with token and user data
     */
    login: async (_: any, { input }: { input: LoginInput }) => {
      try {
        logger.info(`GraphQL login attempt for email: ${input.email}`);

        // Validate input using Zod schemas before processing
        const validation = AuthValidation.validateLogin(input);
        if (!validation.success) {
          const errorMessages = AuthValidation.formatValidationErrors(
            validation.error
          );
          logger.warn(
            `GraphQL login validation failed: ${errorMessages.join(", ")}`
          );
          throw new AuthenticationError(
            errorMessages[0] || "Invalid input data"
          );
        }

        // Process login through AuthService
        const result = await authService.login(input.email, input.password);

        if (!result.success) {
          logger.warn(
            `GraphQL login failed for email: ${input.email} - ${result.error}`
          );
          throw new AuthenticationError(result.error || "Login failed");
        }

        logger.info(`GraphQL login successful for email: ${input.email}`);
        return result.data;
      } catch (error) {
        logger.error("GraphQL login resolver error:", error);

        // Re-throw authentication errors to maintain proper GraphQL error handling
        if (error instanceof AuthenticationError) {
          throw error;
        }

        // Convert other errors to generic authentication errors for security
        throw new AuthenticationError("An error occurred during login");
      }
    },

    /**
     * User registration mutation
     *
     * Creates a new user account with email and password, returning a JWT token
     * and user information upon successful registration.
     *
     * @param input - Registration data (email and password)
     * @returns Authentication payload with token and user data
     */
    register: async (_: any, { input }: { input: RegisterInput }) => {
      try {
        logger.info(`GraphQL registration attempt for email: ${input.email}`);

        // Validate input using Zod schemas with stricter password requirements
        const validation = AuthValidation.validateRegister(input);
        if (!validation.success) {
          const errorMessages = AuthValidation.formatValidationErrors(
            validation.error
          );
          logger.warn(
            `GraphQL registration validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new Error(errorMessages[0] || "Invalid input data");
        }

        // Process registration through AuthService
        const result = await authService.register(input.email, input.password);

        if (!result.success) {
          logger.warn(
            `GraphQL registration failed for email: ${input.email} - ${result.error}`
          );
          throw new Error(result.error || "Registration failed");
        }

        logger.info(
          `GraphQL registration successful for email: ${input.email}`
        );
        return result.data;
      } catch (error) {
        logger.error("GraphQL register resolver error:", error);

        // Re-throw known errors to maintain proper error messages
        if (error instanceof Error) {
          throw error;
        }

        // Convert unknown errors to generic errors
        throw new Error("An error occurred during registration");
      }
    },
  },
};
