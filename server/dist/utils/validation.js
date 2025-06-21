"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = void 0;
const types_1 = require("../types");
class ValidationUtils {
    /**
     * Validate transaction input
     */
    static validateTransactionInput(input) {
        const errors = [];
        // Validate type
        if (!input.type || !Object.values(types_1.TransactionType).includes(input.type)) {
            errors.push("Transaction type must be either INCOME or EXPENSE");
        }
        // Validate amount
        if (typeof input.amount !== "number" || input.amount <= 0) {
            errors.push("Amount must be a positive number");
        }
        if (input.amount > 999999.99) {
            errors.push("Amount cannot exceed 999,999.99");
        }
        // Validate date
        if (!input.date) {
            errors.push("Date is required");
        }
        else {
            const date = new Date(input.date);
            if (isNaN(date.getTime())) {
                errors.push("Invalid date format");
            }
        }
        // Validate description (optional)
        if (input.description && input.description.length > 500) {
            errors.push("Description cannot exceed 500 characters");
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Validate transaction filter
     */
    static validateTransactionFilter(filter) {
        const errors = [];
        // Validate type (optional)
        if (filter.type && !Object.values(types_1.TransactionType).includes(filter.type)) {
            errors.push("Filter type must be either INCOME or EXPENSE");
        }
        // Validate start date (optional)
        if (filter.startDate) {
            const startDate = new Date(filter.startDate);
            if (isNaN(startDate.getTime())) {
                errors.push("Invalid start date format");
            }
        }
        // Validate end date (optional)
        if (filter.endDate) {
            const endDate = new Date(filter.endDate);
            if (isNaN(endDate.getTime())) {
                errors.push("Invalid end date format");
            }
        }
        // Validate date range
        if (filter.startDate && filter.endDate) {
            const startDate = new Date(filter.startDate);
            const endDate = new Date(filter.endDate);
            if (startDate > endDate) {
                errors.push("Start date cannot be after end date");
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Sanitize string input
     */
    static sanitizeString(input) {
        return input.trim().replace(/[<>]/g, "");
    }
    /**
     * Validate pagination parameters
     */
    static validatePagination(page, limit) {
        const validPage = Math.max(1, page || 1);
        const validLimit = Math.min(100, Math.max(1, limit || 10));
        return { page: validPage, limit: validLimit };
    }
    /**
     * Check if value is a positive integer
     */
    static isPositiveInteger(value) {
        return Number.isInteger(value) && value > 0;
    }
    /**
     * Check if value is a valid decimal with up to 2 decimal places
     */
    static isValidDecimal(value, maxDecimalPlaces = 2) {
        if (typeof value !== "number")
            return false;
        const decimalPlaces = (value.toString().split(".")[1] || "").length;
        return decimalPlaces <= maxDecimalPlaces;
    }
    /**
     * Validate GraphQL input arguments
     */
    static validateGraphQLInput(input, requiredFields) {
        const errors = [];
        // Check required fields
        for (const field of requiredFields) {
            if (input[field] === undefined ||
                input[field] === null ||
                input[field] === "") {
                errors.push(`${field} is required`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Validate ID parameter
     */
    static validateId(id) {
        const numId = typeof id === "string" ? parseInt(id, 10) : id;
        if (isNaN(numId) || numId <= 0) {
            return { valid: false, error: "Invalid ID format" };
        }
        return { valid: true };
    }
    /**
     * Rate limiting validation
     */
    static validateRateLimit(requests, maxRequests) {
        return requests <= maxRequests;
    }
}
exports.ValidationUtils = ValidationUtils;
