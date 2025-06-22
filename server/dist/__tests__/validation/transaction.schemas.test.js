"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_schemas_1 = require("../../validation/transaction.schemas");
/**
 * Test suite for transaction validation schemas using Zod
 *
 * This test suite covers all validation scenarios for the new Zod-based
 * validation system, ensuring comprehensive input validation and proper
 * error handling for transaction operations.
 */
describe("TransactionValidation", () => {
    describe("validateTransactionInput", () => {
        it("should validate correct transaction input", () => {
            const input = {
                type: "EXPENSE",
                amount: 100.5,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });
        it("should validate transaction without description", () => {
            var _a;
            const input = {
                type: "INCOME",
                amount: 250.75,
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.description).toBeUndefined();
        });
        it("should reject invalid transaction type", () => {
            const input = {
                type: "INVALID",
                amount: 100.5,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Transaction type must be either INCOME or EXPENSE"))).toBe(true);
        });
        it("should reject negative amount", () => {
            const input = {
                type: "EXPENSE",
                amount: -100,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount must be a positive number"))).toBe(true);
        });
        it("should reject zero amount", () => {
            const input = {
                type: "EXPENSE",
                amount: 0,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount must be a positive number"))).toBe(true);
        });
        it("should reject amount that exceeds maximum", () => {
            const input = {
                type: "EXPENSE",
                amount: 1000000,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount cannot exceed 999,999.99"))).toBe(true);
        });
        it("should reject amount with more than 2 decimal places", () => {
            const input = {
                type: "EXPENSE",
                amount: 100.123,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount cannot have more than 2 decimal places"))).toBe(true);
        });
        it("should reject invalid date format", () => {
            const input = {
                type: "EXPENSE",
                amount: 100,
                description: "Test transaction",
                date: "invalid-date",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Invalid date format"))).toBe(true);
        });
        it("should reject date too far in the future", () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 2);
            const input = {
                type: "EXPENSE",
                amount: 100,
                description: "Test transaction",
                date: futureDate.toISOString().split("T")[0],
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Date cannot be more than 1 year in the future"))).toBe(true);
        });
        it("should reject description that is too long", () => {
            const input = {
                type: "EXPENSE",
                amount: 100,
                description: "a".repeat(501),
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Description cannot exceed 500 characters"))).toBe(true);
        });
        it("should handle empty description by converting to undefined", () => {
            var _a;
            const input = {
                type: "EXPENSE",
                amount: 100,
                description: "",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.description).toBeUndefined();
        });
        it("should trim whitespace from description", () => {
            var _a;
            const input = {
                type: "EXPENSE",
                amount: 100,
                description: "  Test transaction  ",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.description).toBe("Test transaction");
        });
        it("should reject missing required fields", () => {
            const input = {
                amount: 100,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("type"))).toBe(true);
        });
        it("should reject non-number amount", () => {
            const input = {
                type: "EXPENSE",
                amount: "100",
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount must be a number"))).toBe(true);
        });
    });
    describe("validateTransactionUpdate", () => {
        it("should validate partial update with single field", () => {
            var _a;
            const input = {
                amount: 150.25,
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.amount).toBe(150.25);
        });
        it("should validate partial update with multiple fields", () => {
            const input = {
                type: "INCOME",
                amount: 200,
                description: "Updated transaction",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });
        it("should reject empty update object", () => {
            const input = {};
            const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("At least one field must be provided for update"))).toBe(true);
        });
        it("should validate update with undefined description (to clear it)", () => {
            var _a;
            const input = {
                description: undefined,
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.description).toBeUndefined();
        });
        it("should reject invalid values in update", () => {
            const input = {
                amount: -50,
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
            expect(result.success).toBe(false);
            const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
            expect(errors.some((error) => error.includes("Amount must be a positive number"))).toBe(true);
        });
    });
    describe("validateTransactionFilter", () => {
        it("should validate empty filter", () => {
            const filter = {};
            const result = transaction_schemas_1.TransactionValidation.validateTransactionFilter(filter);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({});
        });
        it("should validate filter with type only", () => {
            var _a;
            const filter = {
                type: "EXPENSE",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionFilter(filter);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.type).toBe("EXPENSE");
        });
        it("should validate filter with date range", () => {
            const filter = {
                startDate: "2023-01-01",
                endDate: "2023-12-31",
            };
            const result = transaction_schemas_1.TransactionValidation.validateTransactionFilter(filter);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(filter);
        });
        describe("validateTransactionId", () => {
            it("should validate positive integer ID", () => {
                var _a;
                const result = transaction_schemas_1.TransactionValidation.validateTransactionId(123);
                expect(result.success).toBe(true);
                expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.id).toBe(123);
            });
            it("should reject zero ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateTransactionId(0);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Transaction ID must be positive"))).toBe(true);
            });
            it("should reject negative ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateTransactionId(-1);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Transaction ID must be positive"))).toBe(true);
            });
            it("should reject decimal ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateTransactionId(1.5);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Transaction ID must be an integer"))).toBe(true);
            });
            it("should reject non-number ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateTransactionId("abc");
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Transaction ID must be a number"))).toBe(true);
            });
        });
        describe("validateUserId", () => {
            it("should validate positive integer user ID", () => {
                var _a;
                const result = transaction_schemas_1.TransactionValidation.validateUserId(456);
                expect(result.success).toBe(true);
                expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.userId).toBe(456);
            });
            it("should reject zero user ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateUserId(0);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("User ID must be positive"))).toBe(true);
            });
            it("should reject negative user ID", () => {
                const result = transaction_schemas_1.TransactionValidation.validateUserId(-1);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("User ID must be positive"))).toBe(true);
            });
        });
        describe("validatePagination", () => {
            it("should validate correct pagination parameters", () => {
                var _a, _b;
                const input = { page: 2, limit: 20 };
                const result = transaction_schemas_1.TransactionValidation.validatePagination(input);
                expect(result.success).toBe(true);
                expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.page).toBe(2);
                expect((_b = result.data) === null || _b === void 0 ? void 0 : _b.limit).toBe(20);
            });
            it("should use default values when not provided", () => {
                var _a, _b;
                const input = {};
                const result = transaction_schemas_1.TransactionValidation.validatePagination(input);
                expect(result.success).toBe(true);
                expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.page).toBe(1);
                expect((_b = result.data) === null || _b === void 0 ? void 0 : _b.limit).toBe(10);
            });
            it("should reject page less than 1", () => {
                const input = { page: 0 };
                const result = transaction_schemas_1.TransactionValidation.validatePagination(input);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Page must be at least 1"))).toBe(true);
            });
            it("should reject limit greater than 100", () => {
                const input = { limit: 150 };
                const result = transaction_schemas_1.TransactionValidation.validatePagination(input);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Limit cannot exceed 100"))).toBe(true);
            });
            it("should reject non-integer page", () => {
                const input = { page: 1.5 };
                const result = transaction_schemas_1.TransactionValidation.validatePagination(input);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.some((error) => error.includes("Page must be an integer"))).toBe(true);
            });
        });
        describe("formatValidationErrors", () => {
            it("should format errors with field paths", () => {
                const input = {
                    type: "INVALID",
                    amount: -100,
                };
                const result = transaction_schemas_1.TransactionValidation.validateTransactionInput(input);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors.some((error) => error.includes("type:"))).toBe(true);
                expect(errors.some((error) => error.includes("amount:"))).toBe(true);
            });
            it("should handle errors without field paths", () => {
                const input = {};
                const result = transaction_schemas_1.TransactionValidation.validateTransactionUpdate(input);
                expect(result.success).toBe(false);
                const errors = transaction_schemas_1.TransactionValidation.formatValidationErrors(result.error);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0]).not.toContain(":");
            });
        });
        describe("sanitizeString", () => {
            it("should remove dangerous characters", () => {
                const input = '<script>alert("xss")</script>';
                const result = transaction_schemas_1.TransactionValidation.sanitizeString(input);
                expect(result).toBe('scriptalert("xss")/script');
            });
            it("should trim whitespace", () => {
                const input = "  test string  ";
                const result = transaction_schemas_1.TransactionValidation.sanitizeString(input);
                expect(result).toBe("test string");
            });
            it("should normalize multiple spaces", () => {
                const input = "test    multiple   spaces";
                const result = transaction_schemas_1.TransactionValidation.sanitizeString(input);
                expect(result).toBe("test multiple spaces");
            });
            it("should handle empty string", () => {
                const input = "";
                const result = transaction_schemas_1.TransactionValidation.sanitizeString(input);
                expect(result).toBe("");
            });
        });
        describe("validateAndSanitizeDescription", () => {
            it("should return null for empty description", () => {
                const result = transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription("");
                expect(result).toBeNull();
            });
            it("should return null for whitespace-only description", () => {
                const result = transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription("   ");
                expect(result).toBeNull();
            });
            it("should return null for undefined description", () => {
                const result = transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription(undefined);
                expect(result).toBeNull();
            });
            it("should sanitize and return valid description", () => {
                const input = "  Valid description  ";
                const result = transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription(input);
                expect(result).toBe("Valid description");
            });
            it("should throw error for description that is too long", () => {
                const input = "a".repeat(501);
                expect(() => {
                    transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription(input);
                }).toThrow("Description cannot exceed 500 characters");
            });
            it("should sanitize dangerous characters in description", () => {
                const input = '<script>alert("xss")</script> Valid description';
                const result = transaction_schemas_1.TransactionValidation.validateAndSanitizeDescription(input);
                expect(result).toBe('scriptalert("xss")/script Valid description');
            });
        });
    });
});
