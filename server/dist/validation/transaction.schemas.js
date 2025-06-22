"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionValidation = exports.paginationSchema = exports.userIdParamSchema = exports.transactionIdParamSchema = exports.transactionFilterSchema = exports.transactionUpdateSchema = exports.transactionInputSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
/**
 * Validation schemas for transaction-related operations
 *
 * These schemas provide comprehensive input validation using Zod,
 * ensuring data integrity and security for transaction management flows.
 * Following the same patterns established in the authentication service.
 */
// Transaction type validation schema
const transactionTypeSchema = zod_1.z.nativeEnum(types_1.TransactionType, {
    errorMap: () => ({
        message: "Transaction type must be either INCOME or EXPENSE",
    }),
});
// Amount validation schema with business rules
const amountSchema = zod_1.z
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
const dateSchema = zod_1.z
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
const descriptionSchema = zod_1.z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val));
// Transaction ID validation schema
const transactionIdSchema = zod_1.z
    .number({
    required_error: "Transaction ID is required",
    invalid_type_error: "Transaction ID must be a number",
})
    .int("Transaction ID must be an integer")
    .positive("Transaction ID must be positive");
// User ID validation schema
const userIdSchema = zod_1.z
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
exports.transactionInputSchema = zod_1.z.object({
    type: transactionTypeSchema,
    amount: amountSchema,
    description: descriptionSchema,
    date: dateSchema,
});
/**
 * Transaction update input validation schema
 * Validates partial updates to existing transactions
 */
exports.transactionUpdateSchema = zod_1.z
    .object({
    type: transactionTypeSchema.optional(),
    amount: amountSchema.optional(),
    description: descriptionSchema,
    date: dateSchema.optional(),
})
    .refine((data) => Object.keys(data).length > 0, "At least one field must be provided for update");
/**
 * Transaction filter validation schema
 * Validates filter parameters for transaction queries
 */
exports.transactionFilterSchema = zod_1.z
    .object({
    type: transactionTypeSchema.optional(),
    startDate: zod_1.z
        .string()
        .optional()
        .refine((dateString) => {
        if (!dateString)
            return true;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }, "Invalid start date format"),
    endDate: zod_1.z
        .string()
        .optional()
        .refine((dateString) => {
        if (!dateString)
            return true;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }, "Invalid end date format"),
})
    .refine((data) => {
    if (!data.startDate || !data.endDate)
        return true;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return startDate <= endDate;
}, "Start date cannot be after end date");
/**
 * Transaction ID parameter validation schema
 * Validates transaction ID from URL parameters or GraphQL arguments
 */
exports.transactionIdParamSchema = zod_1.z.object({
    id: transactionIdSchema,
});
/**
 * User ID parameter validation schema
 * Validates user ID for transaction operations
 */
exports.userIdParamSchema = zod_1.z.object({
    userId: userIdSchema,
});
/**
 * Pagination parameters validation schema
 * Validates pagination parameters for transaction lists
 */
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z
        .number()
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .default(1),
    limit: zod_1.z
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
class TransactionValidation {
    /**
     * Validates transaction input and returns parsed data or validation errors
     */
    static validateTransactionInput(input) {
        return exports.transactionInputSchema.safeParse(input);
    }
    /**
     * Validates transaction update input and returns parsed data or validation errors
     */
    static validateTransactionUpdate(input) {
        return exports.transactionUpdateSchema.safeParse(input);
    }
    /**
     * Validates transaction filter and returns parsed data or validation errors
     */
    static validateTransactionFilter(input) {
        return exports.transactionFilterSchema.safeParse(input);
    }
    /**
     * Validates transaction ID and returns parsed data or validation errors
     */
    static validateTransactionId(input) {
        return exports.transactionIdParamSchema.safeParse({ id: input });
    }
    /**
     * Validates user ID and returns parsed data or validation errors
     */
    static validateUserId(input) {
        return exports.userIdParamSchema.safeParse({ userId: input });
    }
    /**
     * Validates pagination parameters and returns parsed data or validation errors
     */
    static validatePagination(input) {
        return exports.paginationSchema.safeParse(input);
    }
    /**
     * Formats Zod validation errors into user-friendly messages
     * Following the same pattern as AuthValidation.formatValidationErrors
     */
    static formatValidationErrors(error) {
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
    static sanitizeString(input) {
        return input
            .trim()
            .replace(/[<>]/g, "") // Remove potential XSS characters
            .replace(/\s+/g, " "); // Normalize whitespace
    }
    /**
     * Validates and sanitizes description field
     */
    static validateAndSanitizeDescription(description) {
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
exports.TransactionValidation = TransactionValidation;
