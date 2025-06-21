import {
  Transaction,
  ITransactionRepository,
  TransactionFilter,
  Summary,
  TransactionType,
} from "../types";
import { prisma } from "../database/connection";
import logger from "../utils/logger";

export class TransactionRepository implements ITransactionRepository {
  async findById(id: number): Promise<Transaction | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) return null;

      return {
        ...transaction,
        amount: Number(transaction.amount),
      };
    } catch (error) {
      logger.error(`Error finding transaction by id ${id}:`, error);
      throw new Error("Failed to find transaction");
    }
  }

  async findByUserId(
    userId: number,
    filter?: TransactionFilter
  ): Promise<Transaction[]> {
    try {
      const where: any = { userId };

      // Apply filters
      if (filter?.type) {
        where.type = filter.type;
      }

      if (filter?.startDate || filter?.endDate) {
        where.date = {};
        if (filter.startDate) {
          where.date.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
          where.date.lte = new Date(filter.endDate);
        }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
      });

      return transactions.map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      }));
    } catch (error) {
      logger.error(`Error finding transactions for user ${userId}:`, error);
      throw new Error("Failed to find transactions");
    }
  }

  async create(
    transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          userId: transactionData.userId,
          type: transactionData.type,
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date,
        },
      });

      return {
        ...transaction,
        amount: Number(transaction.amount),
      };
    } catch (error) {
      logger.error("Error creating transaction:", error);
      throw new Error("Failed to create transaction");
    }
  }

  async update(
    id: number,
    transactionData: Partial<Transaction>
  ): Promise<Transaction | null> {
    try {
      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...(transactionData.type && { type: transactionData.type }),
          ...(transactionData.amount !== undefined && {
            amount: transactionData.amount,
          }),
          ...(transactionData.description !== undefined && {
            description: transactionData.description,
          }),
          ...(transactionData.date && { date: transactionData.date }),
        },
      });

      return {
        ...transaction,
        amount: Number(transaction.amount),
      };
    } catch (error) {
      logger.error(`Error updating transaction ${id}:`, error);
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return null;
      }
      throw new Error("Failed to update transaction");
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.transaction.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting transaction ${id}:`, error);
      if (
        error instanceof Error &&
        error.message.includes("Record to delete does not exist")
      ) {
        return false;
      }
      throw new Error("Failed to delete transaction");
    }
  }

  async getSummary(userId: number): Promise<Summary> {
    try {
      const [incomeResult, expenseResult, transactionCount] = await Promise.all(
        [
          prisma.transaction.aggregate({
            where: { userId, type: TransactionType.INCOME },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { userId, type: TransactionType.EXPENSE },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: { userId },
          }),
        ]
      );

      const totalIncome = Number(incomeResult._sum.amount) || 0;
      const totalExpense = Number(expenseResult._sum.amount) || 0;
      const balance = totalIncome - totalExpense;

      return {
        totalIncome,
        totalExpense,
        balance,
        transactionCount,
      };
    } catch (error) {
      logger.error(`Error getting summary for user ${userId}:`, error);
      throw new Error("Failed to get summary");
    }
  }
}
