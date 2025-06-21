import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { TransactionService } from '../../services';
import { UserRepository } from '../../repositories';
import { GraphQLContext, TransactionInput, TransactionFilter } from '../../types';
import logger from '../../utils/logger';

const transactionService = new TransactionService();
const userRepository = new UserRepository();

export const transactionResolvers = {
  Query: {
    transactions: async (_: any, { filter }: { filter?: TransactionFilter }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access transactions');
      }

      try {
        const result = await transactionService.getTransactions(context.user.id, filter);
        
        if (!result.success) {
          throw new UserInputError(result.error || 'Failed to retrieve transactions');
        }

        return result.data || [];
      } catch (error) {
        logger.error('Transactions query error:', error);
        if (error instanceof AuthenticationError || error instanceof UserInputError) {
          throw error;
        }
        throw new Error('An error occurred while retrieving transactions');
      }
    },

    transaction: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access transactions');
      }

      try {
        const result = await transactionService.getTransaction(parseInt(id), context.user.id);
        
        if (!result.success) {
          if (result.error === 'Access denied') {
            throw new ForbiddenError('You do not have permission to access this transaction');
          }
          throw new Error(result.error || 'Transaction not found');
        }

        return result.data;
      } catch (error) {
        logger.error('Transaction query error:', error);
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('An error occurred while retrieving the transaction');
      }
    },

    summary: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access summary');
      }

      try {
        const result = await transactionService.getSummary(context.user.id);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to retrieve summary');
        }

        return result.data;
      } catch (error) {
        logger.error('Summary query error:', error);
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('An error occurred while retrieving summary');
      }
    },
  },

  Mutation: {
    addTransaction: async (_: any, { input }: { input: TransactionInput }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to add transactions');
      }

      try {
        const result = await transactionService.createTransaction(context.user.id, input);
        
        if (!result.success) {
          throw new UserInputError(result.error || 'Failed to create transaction');
        }

        return result.data;
      } catch (error) {
        logger.error('Add transaction mutation error:', error);
        if (error instanceof AuthenticationError || error instanceof UserInputError) {
          throw error;
        }
        throw new Error('An error occurred while creating the transaction');
      }
    },

    updateTransaction: async (
      _: any, 
      { id, input }: { id: string; input: Partial<TransactionInput> }, 
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update transactions');
      }

      try {
        const result = await transactionService.updateTransaction(parseInt(id), context.user.id, input);
        
        if (!result.success) {
          if (result.error === 'Access denied') {
            throw new ForbiddenError('You do not have permission to update this transaction');
          }
          throw new UserInputError(result.error || 'Failed to update transaction');
        }

        return result.data;
      } catch (error) {
        logger.error('Update transaction mutation error:', error);
        if (error instanceof AuthenticationError || error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        throw new Error('An error occurred while updating the transaction');
      }
    },

    deleteTransaction: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete transactions');
      }

      try {
        const result = await transactionService.deleteTransaction(parseInt(id), context.user.id);
        
        if (!result.success) {
          if (result.error === 'Access denied') {
            throw new ForbiddenError('You do not have permission to delete this transaction');
          }
          throw new Error(result.error || 'Failed to delete transaction');
        }

        return result.data;
      } catch (error) {
        logger.error('Delete transaction mutation error:', error);
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('An error occurred while deleting the transaction');
      }
    },
  },

  // Field resolvers
  Transaction: {
    user: async (parent: any) => {
      try {
        return await userRepository.findById(parent.userId);
      } catch (error) {
        logger.error('Transaction.user resolver error:', error);
        return null;
      }
    },
  },
};
