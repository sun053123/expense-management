import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # Enums
  enum TransactionType {
    INCOME
    EXPENSE
  }

  # Types
  type User {
    id: ID!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type Transaction {
    id: ID!
    userId: ID!
    type: TransactionType!
    amount: Float!
    description: String
    date: String!
    createdAt: String!
    updatedAt: String!
    user: User
  }

  type Summary {
    totalIncome: Float!
    totalExpense: Float!
    balance: Float!
    transactionCount: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Input Types
  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
  }

  input TransactionInput {
    type: TransactionType!
    amount: Float!
    description: String
    date: String!
  }

  input TransactionUpdateInput {
    type: TransactionType
    amount: Float
    description: String
    date: String
  }

  input TransactionFilter {
    type: TransactionType
    startDate: String
    endDate: String
  }

  # Queries
  type Query {
    # User queries
    me: User

    # Transaction queries
    transactions(filter: TransactionFilter): [Transaction!]!
    transaction(id: ID!): Transaction
    summary: Summary!

    # Health check
    health: String!
  }

  # Mutations
  type Mutation {
    # Authentication mutations
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!

    # Transaction mutations
    addTransaction(input: TransactionInput!): Transaction!
    updateTransaction(id: ID!, input: TransactionUpdateInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
  }

  # Subscriptions (for future real-time features)
  type Subscription {
    transactionAdded: Transaction!
    transactionUpdated: Transaction!
    transactionDeleted: ID!
  }
`;
