import { z } from "zod";
import { TransactionType } from "../types";

/**
 * Validation schemas for transaction-related operations
 *
 * These schemas provide comprehensive input validation using Zod,
 * ensuring data integrity and security for transaction management flows.
 * Following the same patterns established in the authentication service.
 */

// Transaction type validation schema
const transactionTypeSchema = z.nativeEnum(TransactionType, {
  errorMap: () => ({
    message: "Transaction type must be either INCOME or EXPENSE",
  }),
});

// Amount validation schema with business rules
const amountSchema = z
  .number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  })
  .positive("Amount must be a positive number")
  .max(999999.99, "Amount cannot exceed 999,999.99")
  .refine((amount) => {
    // Check for maximum 2 decimal places
    const decimalPlaces = (amount.toString().split(".")[1] || "").length;
    return decimalPlaces <= 2;
  }, "Amount cannot have more than 2 decimal places");

// Date validation schema
const dateSchema = z
  .string({
    required_error: "Date is required",
    invalid_type_error: "Date must be a string",
  })
  .min(1, "Date cannot be empty")
  .refine((dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }, "Invalid date format. Please use a valid date string (e.g., YYYY-MM-DD)")
  .refine((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(now.getFullYear() + 1);

    return date <= maxFutureDate;
  }, "Date cannot be more than 1 year in the future");

// Description validation schema (optional)
const descriptionSchema = z
  .string()
  .max(500, "Description cannot exceed 500 characters")
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

// Transaction ID validation schema
const transactionIdSchema = z
  .number({
    required_error: "Transaction ID is required",
    invalid_type_error: "Transaction ID must be a number",
  })
  .int("Transaction ID must be an integer")
  .positive("Transaction ID must be positive");

// User ID validation schema
const userIdSchema = z
  .number({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a number",
  })
  .int("User ID must be an integer")
  .positive("User ID must be positive");

/**
 * Transaction creation input validation schema
 * Validates all required fields for creating a new transaction
 */
export const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  amount: amountSchema,
  description: descriptionSchema,
  date: dateSchema,
});

/**
 * Transaction update input validation schema
 * Validates partial updates to existing transactions
 */
export const transactionUpdateSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    amount: amountSchema.optional(),
    description: descriptionSchema,
    date: dateSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update"
  );

/**
 * Transaction filter validation schema
 * Validates filter parameters for transaction queries
 */
export const transactionFilterSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    startDate: z
      .string()
      .optional()
      .refine((dateString) => {
        if (!dateString) return true;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      }, "Invalid start date format"),
    endDate: z
      .string()
      .optional()
      .refine((dateString) => {
        if (!dateString) return true;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      }, "Invalid end date format"),
  })
  .refine((data) => {
    if (!data.startDate || !data.endDate) return true;

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    return startDate <= endDate;
  }, "Start date cannot be after end date");

/**
 * Transaction ID parameter validation schema
 * Validates transaction ID from URL parameters or GraphQL arguments
 */
export const transactionIdParamSchema = z.object({
  id: transactionIdSchema,
});

/**
 * User ID parameter validation schema
 * Validates user ID for transaction operations
 */
export const userIdParamSchema = z.object({
  userId: userIdSchema,
});

/**
 * Pagination parameters validation schema
 * Validates pagination parameters for transaction lists
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
});

/**
 * Validation helper functions
 * Following the same pattern as AuthValidation class
 */
export class TransactionValidation {
  /**
   * Validates transaction input and returns parsed data or validation errors
   */
  static validateTransactionInput(input: unknown) {
    return transactionInputSchema.safeParse(input);
  }

  /**
   * Validates transaction update input and returns parsed data or validation errors
   */
  static validateTransactionUpdate(input: unknown) {
    return transactionUpdateSchema.safeParse(input);
  }

  /**
   * Validates transaction filter and returns parsed data or validation errors
   */
  static validateTransactionFilter(input: unknown) {
    return transactionFilterSchema.safeParse(input);
  }

  /**
   * Validates transaction ID and returns parsed data or validation errors
   */
  static validateTransactionId(input: unknown) {
    return transactionIdParamSchema.safeParse({ id: input });
  }

  /**
   * Validates user ID and returns parsed data or validation errors
   */
  static validateUserId(input: unknown) {
    return userIdParamSchema.safeParse({ userId: input });
  }

  /**
   * Validates pagination parameters and returns parsed data or validation errors
   */
  static validatePagination(input: unknown) {
    return paginationSchema.safeParse(input);
  }

  /**
   * Formats Zod validation errors into user-friendly messages
   * Following the same pattern as AuthValidation.formatValidationErrors
   */
  static formatValidationErrors(error: z.ZodError): string[] {
    return error.errors.map((err) => {
      if (err.path.length > 0) {
        return `${err.path.join(".")}: ${err.message}`;
      }
      return err.message;
    });
  }

  /**
   * Sanitizes string input by trimming whitespace and removing potentially dangerous characters
   * Enhanced version of the original sanitizeString function
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential XSS characters
      .replace(/\s+/g, " "); // Normalize whitespace
  }

  /**
   * Validates and sanitizes description field
   */
  static validateAndSanitizeDescription(description?: string): string | null {
    if (!description || description.trim() === "") {
      return null;
    }

    const sanitized = this.sanitizeString(description);

    if (sanitized.length > 500) {
      throw new Error("Description cannot exceed 500 characters");
    }

    return sanitized;
  }
}

// Type exports for use in other modules
export type TransactionInputType = z.infer<typeof transactionInputSchema>;
export type TransactionUpdateType = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilterType = z.infer<typeof transactionFilterSchema>;
export type PaginationType = z.infer<typeof paginationSchema>;
