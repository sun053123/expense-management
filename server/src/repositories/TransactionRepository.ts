import {
  Transaction,
  ITransactionRepository,
  TransactionFilter,
  Summary,
  TransactionType,
} from "../types";
import database, { DatabaseHelpers } from "../database/postgres";
import logger from "../utils/logger";

/**
 * TransactionRepository - Data access layer for transaction operations
 *
 * This repository handles all database operations for transactions using raw PostgreSQL queries.
 * It provides a clean interface for transaction CRUD operations with proper error handling,
 * SQL injection protection, and comprehensive logging.
 *
 * Key Features:
 * - Raw SQL queries with parameterized statements for security
 * - Transaction retrieval by ID and user ID with filtering
 * - Transaction creation, updates, and deletion with data validation
 * - Financial summary calculations with optimized aggregations
 * - Comprehensive error handling and logging
 * - Type-safe operations with TypeScript
 * - Optimized queries for performance
 *
 * The repository follows clean architecture principles and provides consistent
 * patterns for all database operations.
 */
export class TransactionRepository implements ITransactionRepository {
  /**
   * Find a transaction by its unique ID
   *
   * This method retrieves a single transaction from the database by its ID.
   * It includes proper error handling and data transformation for the amount field.
   *
   * @param id - Unique transaction identifier
   * @returns Transaction object if found, null if not found
   * @throws Error if database operation fails
   */
  async findById(id: number): Promise<Transaction | null> {
    try {
      logger.debug(`Finding transaction by ID: ${id}`);

      const query = `
        SELECT
          id,
          user_id as "userId",
          type,
          amount,
          description,
          date,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM transactions
        WHERE id = $1
      `;

      const transaction = await database.queryOne<Transaction>(query, [id]);

      if (!transaction) {
        logger.debug(`Transaction with ID ${id} not found`);
        return null;
      }

      logger.debug(`Successfully found transaction ${id}`);

      // Transform amount from string to number for easier handling
      return this.transformTransactionData(transaction);
    } catch (error) {
      logger.error(`Database error finding transaction by ID ${id}:`, error);
      throw new Error(`Failed to retrieve transaction with ID ${id}`);
    }
  }

  /**
   * Find all transactions for a specific user with optional filtering
   *
   * This method retrieves transactions for a user with support for filtering by:
   * - Transaction type (INCOME or EXPENSE)
   * - Date range (start and end dates)
   * Results are ordered by date in descending order (newest first).
   *
   * @param userId - User ID to find transactions for
   * @param filter - Optional filter parameters for type and date range
   * @returns Array of transactions matching the criteria
   * @throws Error if database operation fails
   */
  async findByUserId(
    userId: number,
    filter?: TransactionFilter
  ): Promise<Transaction[]> {
    try {
      logger.debug(
        `Finding transactions for user ${userId} with filter:`,
        filter
      );

      // Build the SQL query with dynamic WHERE conditions
      const { whereClause, params } = this.buildSQLWhereClause(userId, filter);

      const query = `
        SELECT
          id,
          user_id as "userId",
          type,
          amount,
          description,
          date,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM transactions
        ${whereClause}
        ORDER BY date DESC
      `;

      const result = await database.query<Transaction>(query, params);
      const transactions = result.rows;

      logger.debug(
        `Found ${transactions.length} transactions for user ${userId}`
      );

      // Transform all transactions to ensure proper data types
      return transactions.map((transaction: Transaction) =>
        this.transformTransactionData(transaction)
      );
    } catch (error) {
      logger.error(
        `Database error finding transactions for user ${userId}:`,
        error
      );
      throw new Error(`Failed to retrieve transactions for user ${userId}`);
    }
  }

  /**
   * Create a new transaction in the database
   *
   * This method creates a new transaction with the provided data.
   * It includes proper error handling and data transformation.
   *
   * @param transactionData - Transaction data without ID and timestamps
   * @returns Created transaction with generated ID and timestamps
   * @throws Error if database operation fails
   */
  async create(
    transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction> {
    try {
      logger.debug(`Creating transaction for user ${transactionData.userId}:`, {
        type: transactionData.type,
        amount: transactionData.amount,
        date: transactionData.date,
      });

      const query = `
        INSERT INTO transactions (user_id, type, amount, description, date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING
          id,
          user_id as "userId",
          type,
          amount,
          description,
          date,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const params = [
        transactionData.userId,
        transactionData.type,
        transactionData.amount,
        transactionData.description,
        transactionData.date,
      ];

      const transaction = await database.queryOne<Transaction>(query, params);

      if (!transaction) {
        throw new Error("Failed to create transaction - no data returned");
      }

      logger.info(
        `Transaction created successfully with ID: ${transaction.id}`
      );

      // Transform amount from string to number for easier handling
      return this.transformTransactionData(transaction);
    } catch (error) {
      logger.error("Database error creating transaction:", error);

      // Handle specific database constraint errors
      if (this.isDatabaseConstraintError(error)) {
        throw new Error("Invalid transaction data provided");
      }

      throw new Error("Failed to create transaction in database");
    }
  }

  /**
   * Update an existing transaction with partial data
   *
   * This method updates a transaction with the provided partial data.
   * It includes proper error handling for not found cases and data transformation.
   *
   * @param id - Transaction ID to update
   * @param transactionData - Partial transaction data to update
   * @returns Updated transaction if found, null if not found
   * @throws Error if database operation fails
   */
  async update(
    id: number,
    transactionData: Partial<Transaction>
  ): Promise<Transaction | null> {
    try {
      logger.debug(`Updating transaction ${id} with data:`, transactionData);

      // Build update data object with only provided fields
      const { updateFields, params } = this.buildSQLUpdateData(transactionData);

      if (updateFields.length === 0) {
        // No fields to update, return current transaction
        logger.debug(`No fields to update for transaction ID: ${id}`);
        return await this.findById(id);
      }

      // Add updated_at timestamp and transaction ID
      updateFields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `
        UPDATE transactions
        SET ${updateFields.join(", ")}
        WHERE id = $${params.length}
        RETURNING
          id,
          user_id as "userId",
          type,
          amount,
          description,
          date,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const transaction = await database.queryOne<Transaction>(query, params);

      if (!transaction) {
        logger.warn(`Transaction ${id} not found for update`);
        return null;
      }

      logger.info(`Transaction ${id} updated successfully`);

      // Transform amount from string to number for easier handling
      return this.transformTransactionData(transaction);
    } catch (error) {
      logger.error(`Database error updating transaction ${id}:`, error);

      // Handle specific database constraint errors
      if (this.isDatabaseConstraintError(error)) {
        throw new Error("Invalid transaction data provided for update");
      }

      throw new Error(`Failed to update transaction ${id} in database`);
    }
  }

  /**
   * Delete a transaction from the database
   *
   * This method deletes a transaction by its ID.
   * It includes proper error handling for not found cases.
   *
   * @param id - Transaction ID to delete
   * @returns true if deleted successfully, false if not found
   * @throws Error if database operation fails
   */
  async delete(id: number): Promise<boolean> {
    try {
      logger.debug(`Deleting transaction ${id}`);

      const query = `DELETE FROM transactions WHERE id = $1`;
      const result = await database.query(query, [id]);

      if (result.rowCount === 0) {
        logger.warn(`Transaction ${id} not found for deletion`);
        return false;
      }

      logger.info(`Transaction ${id} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Database error deleting transaction ${id}:`, error);
      throw new Error(`Failed to delete transaction ${id} from database`);
    }
  }

  /**
   * Get financial summary for a user
   *
   * This method calculates financial summary including total income, total expense,
   * balance, and transaction count for a specific user. It uses database aggregation
   * for optimal performance.
   *
   * @param userId - User ID to calculate summary for
   * @returns Financial summary with totals and balance
   * @throws Error if database operation fails
   */
  async getSummary(userId: number): Promise<Summary> {
    try {
      logger.debug(`Calculating summary for user ${userId}`);

      // Execute all aggregation queries in parallel for better performance
      const [incomeResult, expenseResult, countResult] = await Promise.all([
        database.queryOne<{ total: string | null }>(
          `SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND type = $2`,
          [userId, TransactionType.INCOME]
        ),
        database.queryOne<{ total: string | null }>(
          `SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND type = $2`,
          [userId, TransactionType.EXPENSE]
        ),
        database.queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM transactions WHERE user_id = $1`,
          [userId]
        ),
      ]);

      // Convert string amounts to numbers and handle null values
      const totalIncome = Number(incomeResult?.total) || 0;
      const totalExpense = Number(expenseResult?.total) || 0;
      const balance = totalIncome - totalExpense;
      const transactionCount = parseInt(countResult?.count || "0", 10);

      const summary = {
        totalIncome,
        totalExpense,
        balance,
        transactionCount,
      };

      logger.debug(`Summary calculated for user ${userId}:`, summary);

      return summary;
    } catch (error) {
      logger.error(
        `Database error calculating summary for user ${userId}:`,
        error
      );
      throw new Error(
        `Failed to calculate financial summary for user ${userId}`
      );
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // Following clean architecture patterns for better code organization
  // ===================================================================

  /**
   * Transform raw transaction data from database to application format
   *
   * @param transaction - Raw transaction data from PostgreSQL
   * @returns Transformed transaction with proper data types
   */
  private transformTransactionData(transaction: any): Transaction {
    return {
      ...transaction,
      amount: Number(transaction.amount), // Convert string/decimal to number
    };
  }

  /**
   * Build SQL WHERE clause for transaction queries with filtering
   *
   * @param userId - User ID for the base filter
   * @param filter - Optional filter parameters
   * @returns SQL WHERE clause and parameters
   */
  private buildSQLWhereClause(
    userId: number,
    filter?: TransactionFilter
  ): { whereClause: string; params: any[] } {
    const conditions: string[] = ["user_id = $1"];
    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply type filter if provided
    if (filter?.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filter.type);
      paramIndex++;
    }

    // Apply date range filter if provided
    if (filter?.startDate) {
      conditions.push(`date >= $${paramIndex}`);
      params.push(filter.startDate);
      paramIndex++;
    }

    if (filter?.endDate) {
      conditions.push(`date <= $${paramIndex}`);
      params.push(filter.endDate);
      paramIndex++;
    }

    return {
      whereClause: `WHERE ${conditions.join(" AND ")}`,
      params,
    };
  }

  /**
   * Build SQL UPDATE data for transaction updates
   *
   * @param transactionData - Partial transaction data
   * @returns SQL update fields and parameters
   */
  private buildSQLUpdateData(transactionData: Partial<Transaction>): {
    updateFields: string[];
    params: any[];
  } {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Only include fields that are explicitly provided
    if (transactionData.type !== undefined) {
      updateFields.push(`type = $${paramIndex}`);
      params.push(transactionData.type);
      paramIndex++;
    }
    if (transactionData.amount !== undefined) {
      updateFields.push(`amount = $${paramIndex}`);
      params.push(transactionData.amount);
      paramIndex++;
    }
    if (transactionData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      params.push(transactionData.description);
      paramIndex++;
    }
    if (transactionData.date !== undefined) {
      updateFields.push(`date = $${paramIndex}`);
      params.push(transactionData.date);
      paramIndex++;
    }

    return { updateFields, params };
  }

  /**
   * Check if error is a database constraint violation
   *
   * @param error - Error object to check
   * @returns true if it's a constraint error
   */
  private isDatabaseConstraintError(error: any): boolean {
    return (
      error instanceof Error &&
      (error.message.includes("constraint") ||
        error.message.includes("foreign key") ||
        error.message.includes("unique") ||
        error.message.includes("violates") ||
        (error as any).code === "23503" || // Foreign key violation
        (error as any).code === "23505" || // Unique violation
        (error as any).code === "23514") // Check constraint violation
    );
  }
}
