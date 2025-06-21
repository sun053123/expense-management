import {
  ITransactionService,
  ServiceResponse,
  Transaction,
  TransactionInput,
  TransactionFilter,
  Summary,
} from "../types";
import { TransactionRepository } from "../repositories";
import { ValidationUtils } from "../utils";
import logger from "../utils/logger";

export class TransactionService implements ITransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  async getTransactions(
    userId: number,
    filter?: TransactionFilter
  ): Promise<ServiceResponse<Transaction[]>> {
    try {
      // Validate filter if provided
      if (filter) {
        const validation = ValidationUtils.validateTransactionFilter(filter);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.errors.join(", "),
          };
        }
      }

      const transactions = await this.transactionRepository.findByUserId(
        userId,
        filter
      );

      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      logger.error(`Error getting transactions for user ${userId}:`, error);
      return {
        success: false,
        error: "Failed to retrieve transactions",
      };
    }
  }

  async getTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<Transaction>> {
    try {
      const transaction = await this.transactionRepository.findById(id);

      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      // Check if transaction belongs to the user
      if (transaction.userId !== userId) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error getting transaction ${id}:`, error);
      return {
        success: false,
        error: "Failed to retrieve transaction",
      };
    }
  }

  async createTransaction(
    userId: number,
    input: TransactionInput
  ): Promise<ServiceResponse<Transaction>> {
    try {
      // Validate input
      const validation = ValidationUtils.validateTransactionInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Sanitize description
      const sanitizedDescription = input.description
        ? ValidationUtils.sanitizeString(input.description)
        : null;

      const transactionData = {
        userId,
        type: input.type,
        amount: input.amount,
        description: sanitizedDescription,
        date: new Date(input.date),
      };

      const transaction = await this.transactionRepository.create(
        transactionData
      );

      logger.info(`Transaction created for user ${userId}: ${transaction.id}`);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error creating transaction for user ${userId}:`, error);
      return {
        success: false,
        error: "Failed to create transaction",
      };
    }
  }

  async updateTransaction(
    id: number,
    userId: number,
    input: Partial<TransactionInput>
  ): Promise<ServiceResponse<Transaction>> {
    try {
      // Check if transaction exists and belongs to user
      const existingTransaction = await this.transactionRepository.findById(id);
      if (!existingTransaction) {
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      if (existingTransaction.userId !== userId) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      // Validate input if provided
      if (Object.keys(input).length > 0) {
        const fullInput = {
          type: input.type || existingTransaction.type,
          amount:
            input.amount !== undefined
              ? input.amount
              : existingTransaction.amount,
          description:
            input.description !== undefined
              ? input.description
              : existingTransaction.description || undefined,
          date:
            input.date || existingTransaction.date.toISOString().split("T")[0],
        };

        const validation = ValidationUtils.validateTransactionInput(fullInput);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.errors.join(", "),
          };
        }
      }

      // Prepare update data
      const updateData: Partial<Transaction> = {};
      if (input.type) updateData.type = input.type;
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.description !== undefined) {
        updateData.description = input.description
          ? ValidationUtils.sanitizeString(input.description)
          : null;
      }
      if (input.date) updateData.date = new Date(input.date);

      const transaction = await this.transactionRepository.update(
        id,
        updateData
      );

      if (!transaction) {
        return {
          success: false,
          error: "Failed to update transaction",
        };
      }

      logger.info(`Transaction updated: ${id}`);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error(`Error updating transaction ${id}:`, error);
      return {
        success: false,
        error: "Failed to update transaction",
      };
    }
  }

  async deleteTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if transaction exists and belongs to user
      const existingTransaction = await this.transactionRepository.findById(id);
      if (!existingTransaction) {
        return {
          success: false,
          error: "Transaction not found",
        };
      }

      if (existingTransaction.userId !== userId) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      const deleted = await this.transactionRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          error: "Failed to delete transaction",
        };
      }

      logger.info(`Transaction deleted: ${id}`);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error(`Error deleting transaction ${id}:`, error);
      return {
        success: false,
        error: "Failed to delete transaction",
      };
    }
  }

  async getSummary(userId: number): Promise<ServiceResponse<Summary>> {
    try {
      const summary = await this.transactionRepository.getSummary(userId);

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      logger.error(`Error getting summary for user ${userId}:`, error);
      return {
        success: false,
        error: "Failed to retrieve summary",
      };
    }
  }
}
