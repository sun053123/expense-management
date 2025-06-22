// Common types and interfaces for the expense management system
//
// This file contains all shared types, interfaces, and type definitions used
// throughout the application. It provides a centralized location for type
// definitions to ensure consistency and maintainability.
//
// The types are organized into logical groups:
// - Core Entity Types (User, Transaction)
// - Input/Output Types (GraphQL inputs, API responses)
// - Service and Repository Interfaces
// - Validation and Error Types

import {
  User as PrismaUser,
  Transaction as PrismaTransaction,
  TransactionType as PrismaTransactionType,
} from "@prisma/client";

// ===================================================================
// CORE ENTITY TYPES
// ===================================================================

export interface User extends PrismaUser {}

export interface Transaction extends Omit<PrismaTransaction, "amount"> {
  amount: number; // Override Decimal type to number for easier handling
}

export { PrismaTransactionType as TransactionType };

// ===================================================================
// INPUT/OUTPUT TYPES
// ===================================================================

// Transaction Input Types
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

// Authentication Input Types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Pagination Types
export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===================================================================
// RESPONSE TYPES
// ===================================================================

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

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Enhanced Service Response with additional metadata
export interface DetailedServiceResponse<T> extends ServiceResponse<T> {
  timestamp?: Date;
  requestId?: string;
  validationErrors?: ValidationError[];
}

// API Response wrapper for consistent API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

// ===================================================================
// CONTEXT TYPES
// ===================================================================

export interface GraphQLContext {
  user?: Omit<User, "password">;
  token?: string;
  requestId?: string;
}

// ===================================================================
// REPOSITORY INTERFACES
// ===================================================================

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

// ===================================================================
// SERVICE INTERFACES
// ===================================================================

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

// ===================================================================
// UTILITY TYPES
// ===================================================================

// Type for database entity creation (without auto-generated fields)
export type CreateEntityData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

// Type for database entity updates (partial data)
export type UpdateEntityData<T> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
>;

// Type for safe user data (without password)
export type SafeUser = Omit<User, "password">;

// Type for transaction creation data
export type CreateTransactionData = CreateEntityData<Transaction>;

// Type for transaction update data
export type UpdateTransactionData = UpdateEntityData<Transaction>;

// Enum-like type for transaction types (for better type safety)
export const TRANSACTION_TYPES = {
  INCOME: "INCOME" as const,
  EXPENSE: "EXPENSE" as const,
} as const;

// Type for validation schema results (compatible with Zod)
export interface SchemaValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    errors: Array<{
      path: (string | number)[];
      message: string;
      code?: string;
    }>;
  };
}

// Type for error handling in services
export interface ServiceError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// Type for logging context
export interface LogContext {
  userId?: number;
  transactionId?: number;
  requestId?: string;
  operation?: string;
  [key: string]: any;
}
