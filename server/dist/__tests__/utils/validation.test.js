"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../../utils/validation");
const types_1 = require("../../types");
describe("ValidationUtils", () => {
    describe("validateTransactionInput", () => {
        it("should validate correct transaction input", () => {
            const input = {
                type: types_1.TransactionType.EXPENSE,
                amount: 100.5,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it("should reject invalid transaction type", () => {
            const input = {
                type: "INVALID",
                amount: 100.5,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Transaction type must be either INCOME or EXPENSE");
        });
        it("should reject negative amount", () => {
            const input = {
                type: types_1.TransactionType.EXPENSE,
                amount: -100,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Amount must be a positive number");
        });
        it("should reject amount that is too large", () => {
            const input = {
                type: types_1.TransactionType.EXPENSE,
                amount: 1000000,
                description: "Test transaction",
                date: "2023-12-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Amount cannot exceed 999,999.99");
        });
        it("should reject invalid date", () => {
            const input = {
                type: types_1.TransactionType.EXPENSE,
                amount: 100,
                description: "Test transaction",
                date: "invalid-date",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Invalid date format");
        });
        it("should reject description that is too long", () => {
            const input = {
                type: types_1.TransactionType.EXPENSE,
                amount: 100,
                description: "a".repeat(501),
                date: "2023-12-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Description cannot exceed 500 characters");
        });
    });
    describe("validateTransactionFilter", () => {
        it("should validate correct filter", () => {
            const filter = {
                type: types_1.TransactionType.EXPENSE,
                startDate: "2023-01-01",
                endDate: "2023-12-31",
            };
            const result = validation_1.ValidationUtils.validateTransactionFilter(filter);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it("should reject invalid date range", () => {
            const filter = {
                startDate: "2023-12-31",
                endDate: "2023-01-01",
            };
            const result = validation_1.ValidationUtils.validateTransactionFilter(filter);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Start date cannot be after end date");
        });
    });
    describe("sanitizeString", () => {
        it("should remove dangerous characters", () => {
            const input = '  <script>alert("xss")</script>  ';
            const result = validation_1.ValidationUtils.sanitizeString(input);
            expect(result).toBe('scriptalert("xss")/script');
        });
        it("should trim whitespace", () => {
            const input = "  test string  ";
            const result = validation_1.ValidationUtils.sanitizeString(input);
            expect(result).toBe("test string");
        });
    });
    describe("validatePagination", () => {
        it("should return valid pagination parameters", () => {
            const result = validation_1.ValidationUtils.validatePagination(2, 20);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(20);
        });
        it("should handle invalid page number", () => {
            const result = validation_1.ValidationUtils.validatePagination(-1, 20);
            expect(result.page).toBe(1);
        });
        it("should limit maximum page size", () => {
            const result = validation_1.ValidationUtils.validatePagination(1, 200);
            expect(result.limit).toBe(100);
        });
    });
    describe("isPositiveInteger", () => {
        it("should return true for positive integers", () => {
            expect(validation_1.ValidationUtils.isPositiveInteger(1)).toBe(true);
            expect(validation_1.ValidationUtils.isPositiveInteger(100)).toBe(true);
        });
        it("should return false for non-positive numbers", () => {
            expect(validation_1.ValidationUtils.isPositiveInteger(0)).toBe(false);
            expect(validation_1.ValidationUtils.isPositiveInteger(-1)).toBe(false);
            expect(validation_1.ValidationUtils.isPositiveInteger(1.5)).toBe(false);
        });
    });
    describe("validateId", () => {
        it("should validate positive integer IDs", () => {
            expect(validation_1.ValidationUtils.validateId(1).valid).toBe(true);
            expect(validation_1.ValidationUtils.validateId("123").valid).toBe(true);
        });
        it("should reject invalid IDs", () => {
            expect(validation_1.ValidationUtils.validateId(0).valid).toBe(false);
            expect(validation_1.ValidationUtils.validateId(-1).valid).toBe(false);
            expect(validation_1.ValidationUtils.validateId("abc").valid).toBe(false);
        });
    });
});
