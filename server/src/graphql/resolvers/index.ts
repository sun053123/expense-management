import { authResolvers } from './authResolvers';
import { transactionResolvers } from './transactionResolvers';

// Merge all resolvers
export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...transactionResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...transactionResolvers.Mutation,
  },
  Transaction: {
    ...transactionResolvers.Transaction,
  },
};
