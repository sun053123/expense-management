import { gql } from '@apollo/client';

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      createdAt
      updatedAt
    }
  }
`;

// Transaction Queries
export const GET_TRANSACTIONS = gql`
  query GetTransactions($filter: TransactionFilter) {
    transactions(filter: $filter) {
      id
      userId
      type
      amount
      description
      date
      createdAt
      updatedAt
    }
  }
`;

export const GET_TRANSACTION = gql`
  query GetTransaction($id: ID!) {
    transaction(id: $id) {
      id
      userId
      type
      amount
      description
      date
      createdAt
      updatedAt
      user {
        id
        email
      }
    }
  }
`;

export const GET_SUMMARY = gql`
  query GetSummary {
    summary {
      totalIncome
      totalExpense
      balance
      transactionCount
    }
  }
`;

// Health Check Query
export const HEALTH_CHECK = gql`
  query HealthCheck {
    health
  }
`;
