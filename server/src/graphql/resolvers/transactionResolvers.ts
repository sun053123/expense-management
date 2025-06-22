import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from "apollo-server-express";
import { TransactionService } from "../../services";
import { UserRepository } from "../../repositories";
import {
  GraphQLContext,
  TransactionInput,
  TransactionFilter,
} from "../../types";
import { TransactionValidation } from "../../validation/transaction.schemas";
import logger from "../../utils/logger";

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

const transactionService = new TransactionService();
const userRepository = new UserRepository();

export const transactionResolvers = {
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
    transactions: async (
      _: any,
      { filter }: { filter?: TransactionFilter },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to transactions query");
        throw new AuthenticationError(
          "You must be logged in to access transactions"
        );
      }

      try {
        logger.info(`GraphQL transactions query for user ${context.user.id}`);

        // Validate filter parameters using Zod schemas before processing
        if (filter) {
          const validation =
            TransactionValidation.validateTransactionFilter(filter);
          if (!validation.success) {
            const errorMessages = TransactionValidation.formatValidationErrors(
              validation.error
            );
            logger.warn(
              `GraphQL transactions filter validation failed: ${errorMessages.join(
                ", "
              )}`
            );
            throw new UserInputError(
              errorMessages[0] || "Invalid filter parameters"
            );
          }
        }

        // Process transaction retrieval through service layer
        const result = await transactionService.getTransactions(
          context.user.id,
          filter
        );

        if (!result.success) {
          logger.warn(
            `GraphQL transactions query failed for user ${context.user.id}: ${result.error}`
          );
          throw new UserInputError(
            result.error || "Failed to retrieve transactions"
          );
        }

        logger.debug(
          `Retrieved ${result.data?.length || 0} transactions for user ${
            context.user.id
          }`
        );
        return result.data || [];
      } catch (error) {
        logger.error("Transactions query error:", error);
        if (
          error instanceof AuthenticationError ||
          error instanceof UserInputError
        ) {
          throw error;
        }
        throw new Error("An error occurred while retrieving transactions");
      }
    },

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
    transaction: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to transaction query");
        throw new AuthenticationError(
          "You must be logged in to access transactions"
        );
      }

      try {
        logger.info(
          `GraphQL transaction query for ID ${id} by user ${context.user.id}`
        );

        // Validate transaction ID using Zod schemas before processing
        const idValidation = TransactionValidation.validateTransactionId(
          parseInt(id)
        );
        if (!idValidation.success) {
          const errorMessages = TransactionValidation.formatValidationErrors(
            idValidation.error
          );
          logger.warn(
            `GraphQL transaction ID validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new UserInputError(
            errorMessages[0] || "Invalid transaction ID"
          );
        }

        // Process transaction retrieval through service layer
        const result = await transactionService.getTransaction(
          parseInt(id),
          context.user.id
        );

        if (!result.success) {
          if (result.error === "Access denied") {
            logger.warn(
              `Access denied: User ${context.user.id} attempted to access transaction ${id}`
            );
            throw new ForbiddenError(
              "You do not have permission to access this transaction"
            );
          }
          logger.warn(
            `GraphQL transaction query failed for ID ${id}: ${result.error}`
          );
          throw new Error(result.error || "Transaction not found");
        }

        logger.debug(
          `Successfully retrieved transaction ${id} for user ${context.user.id}`
        );
        return result.data;
      } catch (error) {
        logger.error("Transaction query error:", error);
        if (
          error instanceof AuthenticationError ||
          error instanceof ForbiddenError ||
          error instanceof UserInputError
        ) {
          throw error;
        }
        throw new Error("An error occurred while retrieving the transaction");
      }
    },

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
    summary: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to summary query");
        throw new AuthenticationError(
          "You must be logged in to access summary"
        );
      }

      try {
        logger.info(`GraphQL summary query for user ${context.user.id}`);

        // Process summary retrieval through service layer
        const result = await transactionService.getSummary(context.user.id);

        if (!result.success) {
          logger.warn(
            `GraphQL summary query failed for user ${context.user.id}: ${result.error}`
          );
          throw new Error(result.error || "Failed to retrieve summary");
        }

        logger.debug(
          `Successfully retrieved summary for user ${context.user.id}`
        );
        return result.data;
      } catch (error) {
        logger.error("Summary query error:", error);
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error("An error occurred while retrieving summary");
      }
    },
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
    addTransaction: async (
      _: any,
      { input }: { input: TransactionInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to addTransaction mutation");
        throw new AuthenticationError(
          "You must be logged in to add transactions"
        );
      }

      try {
        logger.info(
          `GraphQL addTransaction mutation for user ${context.user.id}`
        );

        // Validate transaction input using Zod schemas before processing
        const validation =
          TransactionValidation.validateTransactionInput(input);
        if (!validation.success) {
          const errorMessages = TransactionValidation.formatValidationErrors(
            validation.error
          );
          logger.warn(
            `GraphQL addTransaction input validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new UserInputError(
            errorMessages[0] || "Invalid transaction input"
          );
        }

        // Process transaction creation through service layer
        const result = await transactionService.createTransaction(
          context.user.id,
          input
        );

        if (!result.success) {
          logger.warn(
            `GraphQL addTransaction failed for user ${context.user.id}: ${result.error}`
          );
          throw new UserInputError(
            result.error || "Failed to create transaction"
          );
        }

        logger.info(
          `Transaction created successfully via GraphQL for user ${context.user.id}: ${result.data?.id}`
        );
        return result.data;
      } catch (error) {
        logger.error("Add transaction mutation error:", error);
        if (
          error instanceof AuthenticationError ||
          error instanceof UserInputError
        ) {
          throw error;
        }
        throw new Error("An error occurred while creating the transaction");
      }
    },

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
    updateTransaction: async (
      _: any,
      { id, input }: { id: string; input: Partial<TransactionInput> },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        logger.warn(
          "Unauthorized access attempt to updateTransaction mutation"
        );
        throw new AuthenticationError(
          "You must be logged in to update transactions"
        );
      }

      try {
        logger.info(
          `GraphQL updateTransaction mutation for ID ${id} by user ${context.user.id}`
        );

        // Validate transaction ID using Zod schemas before processing
        const idValidation = TransactionValidation.validateTransactionId(
          parseInt(id)
        );
        if (!idValidation.success) {
          const errorMessages = TransactionValidation.formatValidationErrors(
            idValidation.error
          );
          logger.warn(
            `GraphQL updateTransaction ID validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new UserInputError(
            errorMessages[0] || "Invalid transaction ID"
          );
        }

        // Validate update input using Zod schemas before processing
        const validation =
          TransactionValidation.validateTransactionUpdate(input);
        if (!validation.success) {
          const errorMessages = TransactionValidation.formatValidationErrors(
            validation.error
          );
          logger.warn(
            `GraphQL updateTransaction input validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new UserInputError(errorMessages[0] || "Invalid update data");
        }

        // Process transaction update through service layer
        const result = await transactionService.updateTransaction(
          parseInt(id),
          context.user.id,
          input
        );

        if (!result.success) {
          if (result.error === "Access denied") {
            logger.warn(
              `Access denied: User ${context.user.id} attempted to update transaction ${id}`
            );
            throw new ForbiddenError(
              "You do not have permission to update this transaction"
            );
          }
          logger.warn(
            `GraphQL updateTransaction failed for ID ${id}: ${result.error}`
          );
          throw new UserInputError(
            result.error || "Failed to update transaction"
          );
        }

        logger.info(
          `Transaction ${id} updated successfully via GraphQL by user ${context.user.id}`
        );
        return result.data;
      } catch (error) {
        logger.error("Update transaction mutation error:", error);
        if (
          error instanceof AuthenticationError ||
          error instanceof ForbiddenError ||
          error instanceof UserInputError
        ) {
          throw error;
        }
        throw new Error("An error occurred while updating the transaction");
      }
    },

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
    deleteTransaction: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        logger.warn(
          "Unauthorized access attempt to deleteTransaction mutation"
        );
        throw new AuthenticationError(
          "You must be logged in to delete transactions"
        );
      }

      try {
        logger.info(
          `GraphQL deleteTransaction mutation for ID ${id} by user ${context.user.id}`
        );

        // Validate transaction ID using Zod schemas before processing
        const idValidation = TransactionValidation.validateTransactionId(
          parseInt(id)
        );
        if (!idValidation.success) {
          const errorMessages = TransactionValidation.formatValidationErrors(
            idValidation.error
          );
          logger.warn(
            `GraphQL deleteTransaction ID validation failed: ${errorMessages.join(
              ", "
            )}`
          );
          throw new UserInputError(
            errorMessages[0] || "Invalid transaction ID"
          );
        }

        // Process transaction deletion through service layer
        const result = await transactionService.deleteTransaction(
          parseInt(id),
          context.user.id
        );

        if (!result.success) {
          if (result.error === "Access denied") {
            logger.warn(
              `Access denied: User ${context.user.id} attempted to delete transaction ${id}`
            );
            throw new ForbiddenError(
              "You do not have permission to delete this transaction"
            );
          }
          logger.warn(
            `GraphQL deleteTransaction failed for ID ${id}: ${result.error}`
          );
          throw new Error(result.error || "Failed to delete transaction");
        }

        logger.info(
          `Transaction ${id} deleted successfully via GraphQL by user ${context.user.id}`
        );
        return result.data;
      } catch (error) {
        logger.error("Delete transaction mutation error:", error);
        if (
          error instanceof AuthenticationError ||
          error instanceof ForbiddenError ||
          error instanceof UserInputError
        ) {
          throw error;
        }
        throw new Error("An error occurred while deleting the transaction");
      }
    },
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
    user: async (parent: any) => {
      try {
        logger.debug(`Resolving user for transaction ${parent.id}`);
        return await userRepository.findById(parent.userId);
      } catch (error) {
        logger.error("Transaction.user resolver error:", error);
        return null;
      }
    },
  },
};
