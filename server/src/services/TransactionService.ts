import {
  ITransactionService,
  ServiceResponse,
  Transaction,
  TransactionInput,
  TransactionFilter,
  Summary,
} from "../types";
import { TransactionRepository } from "../repositories";
import { TransactionValidation } from "../validation/transaction.schemas";
import logger from "../utils/logger";

/**
 * TransactionService - Core transaction business logic
 *
 * This service handles all transaction-related operations including:
 * - Transaction creation with comprehensive input validation
 * - Transaction retrieval with filtering capabilities
 * - Transaction updates with partial data support
 * - Transaction deletion with ownership verification
 * - Financial summary calculations
 *
 * The service is designed with security best practices, comprehensive error handling,
 * and clear separation of concerns. Each method is broken down into smaller,
 * well-documented functions for better readability and maintainability.
 *
 * Following the same clean architecture patterns established in the AuthService.
 */
export class TransactionService implements ITransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  /**
   * Retrieve transactions for a user with optional filtering
   *
   * This method handles the complete transaction retrieval flow:
   * 1. Validates user ID and filter parameters using Zod schemas
   * 2. Applies filters for transaction type and date range
   * 3. Returns paginated results ordered by date (newest first)
   *
   * @param userId - ID of the user whose transactions to retrieve
   * @param filter - Optional filter parameters for type and date range
   * @returns Service response with transaction array or error
   */
  async getTransactions(
    userId: number,
    filter?: TransactionFilter
  ): Promise<ServiceResponse<Transaction[]>> {
    try {
      logger.info(`Retrieving transactions for user ${userId}`);

      // Step 1: Validate user ID
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Validate filter parameters if provided
      if (filter) {
        const filterValidation = this.validateTransactionFilter(filter);
        if (!filterValidation.success) {
          return {
            success: false,
            error: filterValidation.error,
          };
        }
      }

      // Step 3: Retrieve transactions from repository
      const transactions = await this.transactionRepository.findByUserId(
        userId,
        filter
      );

      logger.debug(
        `Retrieved ${transactions.length} transactions for user ${userId}`
      );

      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      logger.error(`Error retrieving transactions for user ${userId}:`, error);
      return {
        success: false,
        error: "An error occurred while retrieving transactions",
      };
    }
  }

  /**
   * Retrieve a specific transaction by ID with ownership verification
   *
   * This method handles the complete single transaction retrieval flow:
   * 1. Validates transaction ID and user ID using Zod schemas
   * 2. Retrieves transaction from repository
   * 3. Verifies transaction ownership for security
   * 4. Returns transaction data or appropriate error
   *
   * @param id - Transaction ID to retrieve
   * @param userId - ID of the user requesting the transaction
   * @returns Service response with transaction data or error
   */
  async getTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<Transaction>> {
    try {
      logger.info(`Retrieving transaction ${id} for user ${userId}`);

      // Step 1: Validate transaction ID and user ID
      const idValidation = this.validateTransactionId(id);
      if (!idValidation.success) {
        return {
          success: false,
          error: idValidation.error,
        };
      }

      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Retrieve transaction from repository
      const transaction = await this.transactionRepository.findById(id);

      if (!transaction) {
        logger.warn(`Transaction ${id} not found`);
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      // Step 3: Verify transaction ownership
      const ownershipValidation = this.verifyTransactionOwnership(
        transaction,
        userId
      );
      if (!ownershipValidation.success) {
        return {
          success: false,
          error: ownershipValidation.error,
        };
      }

      logger.debug(
        `Successfully retrieved transaction ${id} for user ${userId}`
      );

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error retrieving transaction ${id}:`, error);
      return {
        success: false,
        error: "An error occurred while retrieving the transaction",
      };
    }
  }

  /**
   * Create a new transaction for a user
   *
   * This method handles the complete transaction creation flow:
   * 1. Validates user ID and transaction input using Zod schemas
   * 2. Sanitizes and processes the input data
   * 3. Creates the transaction in the database
   * 4. Returns the created transaction data
   *
   * @param userId - ID of the user creating the transaction
   * @param input - Transaction input data (type, amount, description, date)
   * @returns Service response with created transaction or error
   */
  async createTransaction(
    userId: number,
    input: TransactionInput
  ): Promise<ServiceResponse<Transaction>> {
    try {
      logger.info(`Creating transaction for user ${userId}`);

      // Step 1: Validate user ID
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Validate transaction input
      const inputValidation = this.validateTransactionInput(input);
      if (!inputValidation.success) {
        return {
          success: false,
          error: inputValidation.error,
        };
      }

      // Step 3: Process and sanitize input data
      const processedData = this.processTransactionInput(userId, input);

      // Step 4: Create transaction in repository
      const transaction = await this.transactionRepository.create(
        processedData
      );

      logger.info(
        `Transaction created successfully for user ${userId}: ${transaction.id}`
      );

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error creating transaction for user ${userId}:`, error);
      return {
        success: false,
        error: "An error occurred while creating the transaction",
      };
    }
  }

  /**
   * Update an existing transaction with partial data
   *
   * This method handles the complete transaction update flow:
   * 1. Validates transaction ID and user ID using Zod schemas
   * 2. Verifies transaction exists and belongs to the user
   * 3. Validates the update input data
   * 4. Processes and sanitizes the update data
   * 5. Updates the transaction in the database
   *
   * @param id - Transaction ID to update
   * @param userId - ID of the user updating the transaction
   * @param input - Partial transaction data to update
   * @returns Service response with updated transaction or error
   */
  async updateTransaction(
    id: number,
    userId: number,
    input: Partial<TransactionInput>
  ): Promise<ServiceResponse<Transaction>> {
    try {
      logger.info(`Updating transaction ${id} for user ${userId}`);

      // Step 1: Validate transaction ID and user ID
      const idValidation = this.validateTransactionId(id);
      if (!idValidation.success) {
        return {
          success: false,
          error: idValidation.error,
        };
      }

      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Retrieve and verify transaction ownership
      const existingTransaction = await this.transactionRepository.findById(id);
      if (!existingTransaction) {
        logger.warn(`Transaction ${id} not found for update`);
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      const ownershipValidation = this.verifyTransactionOwnership(
        existingTransaction,
        userId
      );
      if (!ownershipValidation.success) {
        return {
          success: false,
          error: ownershipValidation.error,
        };
      }

      // Step 3: Validate update input
      const updateValidation = this.validateTransactionUpdate(input);
      if (!updateValidation.success) {
        return {
          success: false,
          error: updateValidation.error,
        };
      }

      // Step 4: Process update data
      const updateData = this.processTransactionUpdate(input);

      // Step 5: Update transaction in repository
      const transaction = await this.transactionRepository.update(
        id,
        updateData
      );

      if (!transaction) {
        logger.error(`Failed to update transaction ${id} in repository`);
        return {
          success: false,
          error: "Failed to update transaction",
        };
      }

      logger.info(`Transaction ${id} updated successfully for user ${userId}`);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error updating transaction ${id}:`, error);
      return {
        success: false,
        error: "An error occurred while updating the transaction",
      };
    }
  }

  /**
   * Delete a transaction with ownership verification
   *
   * This method handles the complete transaction deletion flow:
   * 1. Validates transaction ID and user ID using Zod schemas
   * 2. Verifies transaction exists and belongs to the user
   * 3. Deletes the transaction from the database
   * 4. Returns success confirmation
   *
   * @param id - Transaction ID to delete
   * @param userId - ID of the user deleting the transaction
   * @returns Service response with success status or error
   */
  async deleteTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      logger.info(`Deleting transaction ${id} for user ${userId}`);

      // Step 1: Validate transaction ID and user ID
      const idValidation = this.validateTransactionId(id);
      if (!idValidation.success) {
        return {
          success: false,
          error: idValidation.error,
        };
      }

      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Retrieve and verify transaction ownership
      const existingTransaction = await this.transactionRepository.findById(id);
      if (!existingTransaction) {
        logger.warn(`Transaction ${id} not found for deletion`);
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      const ownershipValidation = this.verifyTransactionOwnership(
        existingTransaction,
        userId
      );
      if (!ownershipValidation.success) {
        return {
          success: false,
          error: ownershipValidation.error,
        };
      }

      // Step 3: Delete transaction from repository
      const deleted = await this.transactionRepository.delete(id);

      if (!deleted) {
        logger.error(`Failed to delete transaction ${id} from repository`);
        return {
          success: false,
          error: "Failed to delete transaction",
        };
      }

      logger.info(`Transaction ${id} deleted successfully for user ${userId}`);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error(`Error deleting transaction ${id}:`, error);
      return {
        success: false,
        error: "An error occurred while deleting the transaction",
      };
    }
  }

  /**
   * Get financial summary for a user
   *
   * This method handles the complete summary retrieval flow:
   * 1. Validates user ID using Zod schemas
   * 2. Retrieves summary data from repository
   * 3. Returns calculated financial summary
   *
   * @param userId - ID of the user to get summary for
   * @returns Service response with financial summary or error
   */
  async getSummary(userId: number): Promise<ServiceResponse<Summary>> {
    try {
      logger.info(`Retrieving summary for user ${userId}`);

      // Step 1: Validate user ID
      const userIdValidation = this.validateUserId(userId);
      if (!userIdValidation.success) {
        return {
          success: false,
          error: userIdValidation.error,
        };
      }

      // Step 2: Retrieve summary from repository
      const summary = await this.transactionRepository.getSummary(userId);

      logger.debug(`Summary retrieved successfully for user ${userId}`);

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      logger.error(`Error retrieving summary for user ${userId}:`, error);
      return {
        success: false,
        error: "An error occurred while retrieving the summary",
      };
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // Following the same patterns as AuthService for consistency
  // ===================================================================

  /**
   * Validate user ID using Zod schemas
   *
   * @param userId - User ID to validate
   * @returns Validation result
   */
  private validateUserId(userId: number): ServiceResponse<null> {
    const validation = TransactionValidation.validateUserId(userId);

    if (!validation.success) {
      const errorMessages = TransactionValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(`User ID validation failed: ${errorMessages.join(", ")}`);

      return {
        success: false,
        error: errorMessages[0] || "Invalid user ID",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Validate transaction ID using Zod schemas
   *
   * @param id - Transaction ID to validate
   * @returns Validation result
   */
  private validateTransactionId(id: number): ServiceResponse<null> {
    const validation = TransactionValidation.validateTransactionId(id);

    if (!validation.success) {
      const errorMessages = TransactionValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(
        `Transaction ID validation failed: ${errorMessages.join(", ")}`
      );

      return {
        success: false,
        error: errorMessages[0] || "Invalid transaction ID",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Validate transaction input using Zod schemas
   *
   * @param input - Transaction input to validate
   * @returns Validation result
   */
  private validateTransactionInput(
    input: TransactionInput
  ): ServiceResponse<null> {
    const validation = TransactionValidation.validateTransactionInput(input);

    if (!validation.success) {
      const errorMessages = TransactionValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(
        `Transaction input validation failed: ${errorMessages.join(", ")}`
      );

      return {
        success: false,
        error: errorMessages[0] || "Invalid transaction input",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Validate transaction update input using Zod schemas
   *
   * @param input - Transaction update input to validate
   * @returns Validation result
   */
  private validateTransactionUpdate(
    input: Partial<TransactionInput>
  ): ServiceResponse<null> {
    const validation = TransactionValidation.validateTransactionUpdate(input);

    if (!validation.success) {
      const errorMessages = TransactionValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(
        `Transaction update validation failed: ${errorMessages.join(", ")}`
      );

      return {
        success: false,
        error: errorMessages[0] || "Invalid transaction update data",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Validate transaction filter using Zod schemas
   *
   * @param filter - Transaction filter to validate
   * @returns Validation result
   */
  private validateTransactionFilter(
    filter: TransactionFilter
  ): ServiceResponse<null> {
    const validation = TransactionValidation.validateTransactionFilter(filter);

    if (!validation.success) {
      const errorMessages = TransactionValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(
        `Transaction filter validation failed: ${errorMessages.join(", ")}`
      );

      return {
        success: false,
        error: errorMessages[0] || "Invalid transaction filter",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Verify transaction ownership for security
   *
   * @param transaction - Transaction to verify
   * @param userId - User ID to verify ownership against
   * @returns Verification result
   */
  private verifyTransactionOwnership(
    transaction: Transaction,
    userId: number
  ): ServiceResponse<null> {
    if (transaction.userId !== userId) {
      logger.warn(
        `Access denied: User ${userId} attempted to access transaction ${transaction.id} owned by user ${transaction.userId}`
      );
      return {
        success: false,
        error: "Access denied",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Process and sanitize transaction input data
   *
   * @param userId - User ID for the transaction
   * @param input - Raw transaction input
   * @returns Processed transaction data ready for database
   */
  private processTransactionInput(
    userId: number,
    input: TransactionInput
  ): Omit<Transaction, "id" | "createdAt" | "updatedAt"> {
    // Sanitize description if provided
    const sanitizedDescription =
      TransactionValidation.validateAndSanitizeDescription(input.description);

    return {
      userId,
      type: input.type,
      amount: input.amount,
      description: sanitizedDescription,
      date: new Date(input.date),
    };
  }

  /**
   * Process transaction update data
   *
   * @param input - Partial transaction update input
   * @returns Processed update data ready for database
   */
  private processTransactionUpdate(
    input: Partial<TransactionInput>
  ): Partial<Transaction> {
    const updateData: Partial<Transaction> = {};

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }

    if (input.description !== undefined) {
      updateData.description =
        TransactionValidation.validateAndSanitizeDescription(input.description);
    }

    if (input.date !== undefined) {
      updateData.date = new Date(input.date);
    }

    return updateData;
  }
}
