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
exports.authResolvers = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const services_1 = require("../../services");
const auth_schemas_1 = require("../../validation/auth.schemas");
const logger_1 = __importDefault(require("../../utils/logger"));
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
const authService = new services_1.AuthService();
exports.authResolvers = {
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
        me: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to me query");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to access this resource");
            }
            logger_1.default.debug(`User ${context.user.id} accessed me query`);
            return context.user;
        }),
        /**
         * Health check endpoint
         *
         * Simple endpoint to verify the GraphQL server is running.
         * Used for monitoring and load balancer health checks.
         *
         * @returns Health status message
         */
        health: () => {
            logger_1.default.debug("Health check endpoint accessed");
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
        login: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { input }) {
            try {
                logger_1.default.info(`GraphQL login attempt for email: ${input.email}`);
                // Validate input using Zod schemas before processing
                const validation = auth_schemas_1.AuthValidation.validateLogin(input);
                if (!validation.success) {
                    const errorMessages = auth_schemas_1.AuthValidation.formatValidationErrors(validation.error);
                    logger_1.default.warn(`GraphQL login validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.AuthenticationError(errorMessages[0] || "Invalid input data");
                }
                // Process login through AuthService
                const result = yield authService.login(input.email, input.password);
                if (!result.success) {
                    logger_1.default.warn(`GraphQL login failed for email: ${input.email} - ${result.error}`);
                    throw new apollo_server_express_1.AuthenticationError(result.error || "Login failed");
                }
                logger_1.default.info(`GraphQL login successful for email: ${input.email}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("GraphQL login resolver error:", error);
                // Re-throw authentication errors to maintain proper GraphQL error handling
                if (error instanceof apollo_server_express_1.AuthenticationError) {
                    throw error;
                }
                // Convert other errors to generic authentication errors for security
                throw new apollo_server_express_1.AuthenticationError("An error occurred during login");
            }
        }),
        /**
         * User registration mutation
         *
         * Creates a new user account with email and password, returning a JWT token
         * and user information upon successful registration.
         *
         * @param input - Registration data (email and password)
         * @returns Authentication payload with token and user data
         */
        register: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { input }) {
            try {
                logger_1.default.info(`GraphQL registration attempt for email: ${input.email}`);
                // Validate input using Zod schemas with stricter password requirements
                const validation = auth_schemas_1.AuthValidation.validateRegister(input);
                if (!validation.success) {
                    const errorMessages = auth_schemas_1.AuthValidation.formatValidationErrors(validation.error);
                    logger_1.default.warn(`GraphQL registration validation failed: ${errorMessages.join(", ")}`);
                    throw new Error(errorMessages[0] || "Invalid input data");
                }
                // Process registration through AuthService
                const result = yield authService.register(input.email, input.password);
                if (!result.success) {
                    logger_1.default.warn(`GraphQL registration failed for email: ${input.email} - ${result.error}`);
                    throw new Error(result.error || "Registration failed");
                }
                logger_1.default.info(`GraphQL registration successful for email: ${input.email}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("GraphQL register resolver error:", error);
                // Re-throw known errors to maintain proper error messages
                if (error instanceof Error) {
                    throw error;
                }
                // Convert unknown errors to generic errors
                throw new Error("An error occurred during registration");
            }
        }),
    },
};
