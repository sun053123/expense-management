// Enums
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// Core Types
export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface AuthPayload {
  token: string;
  user: User;
}

// Input Types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
}

export interface TransactionUpdateInput {
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

// Query Response Types
export interface TransactionsQueryResponse {
  transactions: Transaction[];
}

export interface TransactionQueryResponse {
  transaction: Transaction;
}

export interface SummaryQueryResponse {
  summary: Summary;
}

export interface MeQueryResponse {
  me: User;
}

// Mutation Response Types
export interface LoginMutationResponse {
  login: AuthPayload;
}

export interface RegisterMutationResponse {
  register: AuthPayload;
}

export interface AddTransactionMutationResponse {
  addTransaction: Transaction;
}

export interface UpdateTransactionMutationResponse {
  updateTransaction: Transaction;
}

export interface DeleteTransactionMutationResponse {
  deleteTransaction: boolean;
}
