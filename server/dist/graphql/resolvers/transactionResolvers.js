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
exports.transactionResolvers = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const services_1 = require("../../services");
const repositories_1 = require("../../repositories");
const transaction_schemas_1 = require("../../validation/transaction.schemas");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * GraphQL Transaction Resolvers
 *
 * These resolvers handle transaction-related GraphQL operations:
 * - Transaction retrieval with filtering and pagination
 * - Single transaction access with ownership verification
 * - Transaction creation with comprehensive validation
 * - Transaction updates with partial data support
 * - Transaction deletion with security checks
 * - Financial summary calculations
 *
 * All resolvers include proper error handling, input validation using Zod schemas,
 * and comprehensive logging for monitoring and debugging.
 *
 * Following the same patterns established in the AuthResolvers for consistency.
 */
const transactionService = new services_1.TransactionService();
const userRepository = new repositories_1.UserRepository();
exports.transactionResolvers = {
    Query: {
        /**
         * Retrieve transactions for the authenticated user with optional filtering
         *
         * This resolver handles the complete transaction retrieval flow:
         * - Validates user authentication
         * - Validates filter parameters using Zod schemas
         * - Retrieves transactions through the service layer
         * - Returns filtered and sorted transaction data
         *
         * @param filter - Optional filter parameters for type and date range
         * @param context - GraphQL context containing authenticated user
         * @returns Array of transactions matching the filter criteria
         */
        transactions: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { filter }, context) {
            var _b;
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to transactions query");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to access transactions");
            }
            try {
                logger_1.default.info(`GraphQL transactions query for user ${context.user.id}`);
                // Validate filter parameters using Zod schemas before processing
                if (filter) {
                    const validation = transaction_schemas_1.TransactionValidation.validateTransactionFilter(filter);
                    if (!validation.success) {
                        const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(validation.error);
                        logger_1.default.warn(`GraphQL transactions filter validation failed: ${errorMessages.join(", ")}`);
                        throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid filter parameters");
                    }
                }
                // Process transaction retrieval through service layer
                const result = yield transactionService.getTransactions(context.user.id, filter);
                if (!result.success) {
                    logger_1.default.warn(`GraphQL transactions query failed for user ${context.user.id}: ${result.error}`);
                    throw new apollo_server_express_1.UserInputError(result.error || "Failed to retrieve transactions");
                }
                logger_1.default.debug(`Retrieved ${((_b = result.data) === null || _b === void 0 ? void 0 : _b.length) || 0} transactions for user ${context.user.id}`);
                return result.data || [];
            }
            catch (error) {
                logger_1.default.error("Transactions query error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError ||
                    error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error("An error occurred while retrieving transactions");
            }
        }),
        /**
         * Retrieve a specific transaction by ID with ownership verification
         *
         * This resolver handles the complete single transaction retrieval flow:
         * - Validates user authentication
         * - Validates transaction ID using Zod schemas
         * - Retrieves transaction through the service layer
         * - Verifies transaction ownership for security
         * - Returns transaction data or appropriate error
         *
         * @param id - Transaction ID to retrieve
         * @param context - GraphQL context containing authenticated user
         * @returns Transaction data if found and accessible
         */
        transaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to transaction query");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to access transactions");
            }
            try {
                logger_1.default.info(`GraphQL transaction query for ID ${id} by user ${context.user.id}`);
                // Validate transaction ID using Zod schemas before processing
                const idValidation = transaction_schemas_1.TransactionValidation.validateTransactionId(parseInt(id));
                if (!idValidation.success) {
                    const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(idValidation.error);
                    logger_1.default.warn(`GraphQL transaction ID validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid transaction ID");
                }
                // Process transaction retrieval through service layer
                const result = yield transactionService.getTransaction(parseInt(id), context.user.id);
                if (!result.success) {
                    if (result.error === "Access denied") {
                        logger_1.default.warn(`Access denied: User ${context.user.id} attempted to access transaction ${id}`);
                        throw new apollo_server_express_1.ForbiddenError("You do not have permission to access this transaction");
                    }
                    logger_1.default.warn(`GraphQL transaction query failed for ID ${id}: ${result.error}`);
                    throw new Error(result.error || "Transaction not found");
                }
                logger_1.default.debug(`Successfully retrieved transaction ${id} for user ${context.user.id}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("Transaction query error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError ||
                    error instanceof apollo_server_express_1.ForbiddenError ||
                    error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error("An error occurred while retrieving the transaction");
            }
        }),
        /**
         * Retrieve financial summary for the authenticated user
         *
         * This resolver handles the complete summary retrieval flow:
         * - Validates user authentication
         * - Retrieves financial summary through the service layer
         * - Returns calculated totals and balance information
         *
         * @param context - GraphQL context containing authenticated user
         * @returns Financial summary with income, expense, and balance data
         */
        summary: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to summary query");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to access summary");
            }
            try {
                logger_1.default.info(`GraphQL summary query for user ${context.user.id}`);
                // Process summary retrieval through service layer
                const result = yield transactionService.getSummary(context.user.id);
                if (!result.success) {
                    logger_1.default.warn(`GraphQL summary query failed for user ${context.user.id}: ${result.error}`);
                    throw new Error(result.error || "Failed to retrieve summary");
                }
                logger_1.default.debug(`Successfully retrieved summary for user ${context.user.id}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("Summary query error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError) {
                    throw error;
                }
                throw new Error("An error occurred while retrieving summary");
            }
        }),
    },
    Mutation: {
        /**
         * Create a new transaction for the authenticated user
         *
         * This resolver handles the complete transaction creation flow:
         * - Validates user authentication
         * - Validates transaction input using Zod schemas
         * - Creates transaction through the service layer
         * - Returns created transaction data
         *
         * @param input - Transaction input data (type, amount, description, date)
         * @param context - GraphQL context containing authenticated user
         * @returns Created transaction data
         */
        addTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { input }, context) {
            var _b;
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to addTransaction mutation");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to add transactions");
            }
            try {
                logger_1.default.info(`GraphQL addTransaction mutation for user ${context.user.id}`);
                // Validate transaction input using Zod schemas before processing
                const validation = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
                if (!validation.success) {
                    const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(validation.error);
                    logger_1.default.warn(`GraphQL addTransaction input validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid transaction input");
                }
                // Process transaction creation through service layer
                const result = yield transactionService.createTransaction(context.user.id, input);
                if (!result.success) {
                    logger_1.default.warn(`GraphQL addTransaction failed for user ${context.user.id}: ${result.error}`);
                    throw new apollo_server_express_1.UserInputError(result.error || "Failed to create transaction");
                }
                logger_1.default.info(`Transaction created successfully via GraphQL for user ${context.user.id}: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.id}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("Add transaction mutation error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError ||
                    error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error("An error occurred while creating the transaction");
            }
        }),
        /**
         * Update an existing transaction with partial data
         *
         * This resolver handles the complete transaction update flow:
         * - Validates user authentication
         * - Validates transaction ID and update input using Zod schemas
         * - Updates transaction through the service layer
         * - Verifies transaction ownership for security
         * - Returns updated transaction data
         *
         * @param id - Transaction ID to update
         * @param input - Partial transaction data to update
         * @param context - GraphQL context containing authenticated user
         * @returns Updated transaction data
         */
        updateTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id, input }, context) {
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to updateTransaction mutation");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to update transactions");
            }
            try {
                logger_1.default.info(`GraphQL updateTransaction mutation for ID ${id} by user ${context.user.id}`);
                // Validate transaction ID using Zod schemas before processing
                const idValidation = transaction_schemas_1.TransactionValidation.validateTransactionId(parseInt(id));
                if (!idValidation.success) {
                    const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(idValidation.error);
                    logger_1.default.warn(`GraphQL updateTransaction ID validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid transaction ID");
                }
                // Validate update input using Zod schemas before processing
                const validation = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
                if (!validation.success) {
                    const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(validation.error);
                    logger_1.default.warn(`GraphQL updateTransaction input validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid update data");
                }
                // Process transaction update through service layer
                const result = yield transactionService.updateTransaction(parseInt(id), context.user.id, input);
                if (!result.success) {
                    if (result.error === "Access denied") {
                        logger_1.default.warn(`Access denied: User ${context.user.id} attempted to update transaction ${id}`);
                        throw new apollo_server_express_1.ForbiddenError("You do not have permission to update this transaction");
                    }
                    logger_1.default.warn(`GraphQL updateTransaction failed for ID ${id}: ${result.error}`);
                    throw new apollo_server_express_1.UserInputError(result.error || "Failed to update transaction");
                }
                logger_1.default.info(`Transaction ${id} updated successfully via GraphQL by user ${context.user.id}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("Update transaction mutation error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError ||
                    error instanceof apollo_server_express_1.ForbiddenError ||
                    error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error("An error occurred while updating the transaction");
            }
        }),
        /**
         * Delete a transaction with ownership verification
         *
         * This resolver handles the complete transaction deletion flow:
         * - Validates user authentication
         * - Validates transaction ID using Zod schemas
         * - Deletes transaction through the service layer
         * - Verifies transaction ownership for security
         * - Returns success confirmation
         *
         * @param id - Transaction ID to delete
         * @param context - GraphQL context containing authenticated user
         * @returns Success status (true if deleted)
         */
        deleteTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            if (!context.user) {
                logger_1.default.warn("Unauthorized access attempt to deleteTransaction mutation");
                throw new apollo_server_express_1.AuthenticationError("You must be logged in to delete transactions");
            }
            try {
                logger_1.default.info(`GraphQL deleteTransaction mutation for ID ${id} by user ${context.user.id}`);
                // Validate transaction ID using Zod schemas before processing
                const idValidation = transaction_schemas_1.TransactionValidation.validateTransactionId(parseInt(id));
                if (!idValidation.success) {
                    const errorMessages = transaction_schemas_1.TransactionValidation.formatValidationErrors(idValidation.error);
                    logger_1.default.warn(`GraphQL deleteTransaction ID validation failed: ${errorMessages.join(", ")}`);
                    throw new apollo_server_express_1.UserInputError(errorMessages[0] || "Invalid transaction ID");
                }
                // Process transaction deletion through service layer
                const result = yield transactionService.deleteTransaction(parseInt(id), context.user.id);
                if (!result.success) {
                    if (result.error === "Access denied") {
                        logger_1.default.warn(`Access denied: User ${context.user.id} attempted to delete transaction ${id}`);
                        throw new apollo_server_express_1.ForbiddenError("You do not have permission to delete this transaction");
                    }
                    logger_1.default.warn(`GraphQL deleteTransaction failed for ID ${id}: ${result.error}`);
                    throw new Error(result.error || "Failed to delete transaction");
                }
                logger_1.default.info(`Transaction ${id} deleted successfully via GraphQL by user ${context.user.id}`);
                return result.data;
            }
            catch (error) {
                logger_1.default.error("Delete transaction mutation error:", error);
                if (error instanceof apollo_server_express_1.AuthenticationError ||
                    error instanceof apollo_server_express_1.ForbiddenError ||
                    error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error("An error occurred while deleting the transaction");
            }
        }),
    },
    /**
     * Field Resolvers
     *
     * These resolvers handle nested field resolution for transaction objects.
     * They provide additional data that may not be directly available in the
     * parent transaction object.
     */
    Transaction: {
        /**
         * Resolve user information for a transaction
         *
         * This field resolver retrieves the user who created the transaction.
         * It's used when the GraphQL query requests user data within a transaction.
         *
         * @param parent - Parent transaction object containing userId
         * @returns User object or null if not found
         */
        user: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Resolving user for transaction ${parent.id}`);
                return yield userRepository.findById(parent.userId);
            }
            catch (error) {
                logger_1.default.error("Transaction.user resolver error:", error);
                return null;
            }
        }),
    },
};
