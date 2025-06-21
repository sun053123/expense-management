// Common types and interfaces for the expense management system

import {
  User as PrismaUser,
  Transaction as PrismaTransaction,
  TransactionType as PrismaTransactionType,
} from "@prisma/client";

export interface User extends PrismaUser {}

export interface Transaction extends Omit<PrismaTransaction, "amount"> {
  amount: number; // Override Decimal type to number for easier handling
}

export { PrismaTransactionType as TransactionType };

// GraphQL Input Types
export interface TransactionInput {
  type: PrismaTransactionType;
  amount: number;
  description?: string;
  date: string;
}

export interface TransactionFilter {
  type?: PrismaTransactionType;
  startDate?: string;
  endDate?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

// Response Types
export interface AuthPayload {
  token: string;
  user: Omit<User, "password">;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

// Context Types
export interface GraphQLContext {
  user?: Omit<User, "password">;
  token?: string;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Repository Interfaces
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: number, userData: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

export interface ITransactionRepository {
  findById(id: number): Promise<Transaction | null>;
  findByUserId(
    userId: number,
    filter?: TransactionFilter
  ): Promise<Transaction[]>;
  create(
    transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction>;
  update(
    id: number,
    transactionData: Partial<Transaction>
  ): Promise<Transaction | null>;
  delete(id: number): Promise<boolean>;
  getSummary(userId: number): Promise<Summary>;
}

// Service Interfaces
export interface IAuthService {
  login(email: string, password: string): Promise<ServiceResponse<AuthPayload>>;
  register(
    email: string,
    password: string
  ): Promise<ServiceResponse<AuthPayload>>;
  verifyToken(token: string): Promise<ServiceResponse<Omit<User, "password">>>;
}

export interface ITransactionService {
  getTransactions(
    userId: number,
    filter?: TransactionFilter
  ): Promise<ServiceResponse<Transaction[]>>;
  getTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<Transaction>>;
  createTransaction(
    userId: number,
    input: TransactionInput
  ): Promise<ServiceResponse<Transaction>>;
  updateTransaction(
    id: number,
    userId: number,
    input: Partial<TransactionInput>
  ): Promise<ServiceResponse<Transaction>>;
  deleteTransaction(
    id: number,
    userId: number
  ): Promise<ServiceResponse<boolean>>;
  getSummary(userId: number): Promise<ServiceResponse<Summary>>;
}
