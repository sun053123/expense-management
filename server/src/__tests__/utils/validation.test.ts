/**
 * ValidationUtils Test Suite
 *
 * This test suite validates the input validation utilities that protect our
 * application from invalid data, security vulnerabilities, and user errors.
 * Proper validation is the first line of defense in application security.
 *
 * TESTING STRATEGY:
 * - Test valid inputs (happy path scenarios)
 * - Test invalid inputs (edge cases and boundary conditions)
 * - Test sanitization functions for security
 * - Test error message clarity and usefulness
 * - Test performance with various input sizes
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding defensive programming principles
 * - Learning input validation testing patterns
 * - Grasping boundary testing techniques
 * - Recognizing security validation importance
 * - Understanding user experience in error handling
 */

import { ValidationUtils } from "../../utils/validation";
import { TransactionType } from "../../types";

/**
 * Main test suite for ValidationUtils
 *
 * This describe block groups all validation utility tests, covering
 * transaction validation, sanitization, and helper functions.
 */
describe("ValidationUtils", () => {
  /**
   * TRANSACTION INPUT VALIDATION TESTS
   *
   * These tests validate the core transaction input validation logic.
   * Transaction validation is critical because invalid financial data
   * can cause calculation errors, security issues, and poor user experience.
   *
   * VALIDATION AREAS COVERED:
   * - Transaction type validation (INCOME/EXPENSE only)
   * - Amount validation (positive numbers, reasonable limits)
   * - Date validation (proper format, reasonable ranges)
   * - Description validation (length limits, content sanitization)
   */
  describe("validateTransactionInput", () => {
    /**
     * TEST CASE: Valid Transaction Input (Happy Path)
     *
     * This test validates that properly formatted transaction data
     * passes validation without errors. This represents the most
     * common use case in the application.
     */
    it("should validate correct transaction input", () => {
      // ARRANGE: Create valid transaction input
      const input = {
        type: TransactionType.EXPENSE,
        amount: 100.5,
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation passes
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    /**
     * TEST CASE: Invalid Transaction Type
     *
     * This test ensures that only valid transaction types are accepted.
     * This prevents data corruption and ensures consistent categorization.
     */
    it("should reject invalid transaction type", () => {
      // ARRANGE: Create input with invalid transaction type
      const input = {
        type: "INVALID" as TransactionType,
        amount: 100.5,
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation fails with appropriate error
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Transaction type must be either INCOME or EXPENSE"
      );
    });

    /**
     * TEST CASE: Negative Amount Validation
     *
     * This test ensures that negative amounts are rejected. Financial
     * transactions should always have positive amounts - the type
     * (INCOME/EXPENSE) determines the direction, not the sign.
     */
    it("should reject negative amount", () => {
      // ARRANGE: Create input with negative amount
      const input = {
        type: TransactionType.EXPENSE,
        amount: -100,
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation fails
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Amount must be a positive number");
    });

    /**
     * TEST CASE: Maximum Amount Validation (Boundary Testing)
     *
     * This test validates the upper boundary for transaction amounts.
     * Setting reasonable limits prevents data overflow and catches
     * potential input errors (like extra zeros).
     */
    it("should reject amount that is too large", () => {
      // ARRANGE: Create input with amount exceeding maximum
      const input = {
        type: TransactionType.EXPENSE,
        amount: 1000000, // Exceeds 999,999.99 limit
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation fails with boundary error
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Amount cannot exceed 999,999.99");
    });

    /**
     * TEST CASE: Invalid Date Format
     *
     * This test ensures that only properly formatted dates are accepted.
     * Date validation prevents parsing errors and ensures consistent
     * date handling throughout the application.
     */
    it("should reject invalid date", () => {
      // ARRANGE: Create input with invalid date format
      const input = {
        type: TransactionType.EXPENSE,
        amount: 100,
        description: "Test transaction",
        date: "invalid-date",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation fails with date error
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid date format");
    });

    /**
     * TEST CASE: Description Length Validation (Boundary Testing)
     *
     * This test validates the maximum length for transaction descriptions.
     * Length limits prevent database overflow and ensure consistent
     * user interface display.
     */
    it("should reject description that is too long", () => {
      // ARRANGE: Create input with description exceeding maximum length
      const input = {
        type: TransactionType.EXPENSE,
        amount: 100,
        description: "a".repeat(501), // Exceeds 500 character limit
        date: "2023-12-01",
      };

      // ACT: Validate the input
      const result = ValidationUtils.validateTransactionInput(input);

      // ASSERT: Verify validation fails with length error
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Description cannot exceed 500 characters"
      );
    });
  });

  /**
   * TRANSACTION FILTER VALIDATION TESTS
   *
   * These tests validate filter parameters used for searching and
   * filtering transactions. Proper filter validation prevents
   * database errors and ensures meaningful search results.
   */
  describe("validateTransactionFilter", () => {
    /**
     * TEST CASE: Valid Filter Parameters (Happy Path)
     *
     * This test validates that properly formatted filter parameters
     * pass validation and can be safely used in database queries.
     */
    it("should validate correct filter", () => {
      // ARRANGE: Create valid filter parameters
      const filter = {
        type: TransactionType.EXPENSE,
        startDate: "2023-01-01",
        endDate: "2023-12-31",
      };

      // ACT: Validate the filter
      const result = ValidationUtils.validateTransactionFilter(filter);

      // ASSERT: Verify validation passes
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    /**
     * TEST CASE: Invalid Date Range (Logic Validation)
     *
     * This test ensures that logical constraints are enforced,
     * such as start date being before end date. This prevents
     * nonsensical queries and improves user experience.
     */
    it("should reject invalid date range", () => {
      // ARRANGE: Create filter with start date after end date
      const filter = {
        startDate: "2023-12-31",
        endDate: "2023-01-01", // End date before start date
      };

      // ACT: Validate the filter
      const result = ValidationUtils.validateTransactionFilter(filter);

      // ASSERT: Verify validation fails with logical error
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Start date cannot be after end date");
    });
  });

  /**
   * STRING SANITIZATION TESTS
   *
   * These tests validate string sanitization functions that protect
   * against XSS attacks and ensure clean data storage. Sanitization
   * is a critical security measure for user-generated content.
   *
   * SECURITY FOCUS:
   * - Remove potentially dangerous HTML/script tags
   * - Normalize whitespace for consistent data
   * - Preserve legitimate content while removing threats
   */
  describe("sanitizeString", () => {
    /**
     * TEST CASE: XSS Attack Prevention (Security Critical)
     *
     * This test ensures that potentially dangerous script tags are
     * removed from user input, preventing XSS attacks.
     */
    it("should remove dangerous characters", () => {
      // ARRANGE: Create input with potential XSS payload
      const input = '  <script>alert("xss")</script>  ';

      // ACT: Sanitize the input
      const result = ValidationUtils.sanitizeString(input);

      // ASSERT: Verify dangerous tags are removed
      expect(result).toBe('scriptalert("xss")/script');
      // Note: < and > characters are removed, neutralizing the script
    });

    /**
     * TEST CASE: Whitespace Normalization
     *
     * This test ensures that leading and trailing whitespace is
     * removed, providing consistent data storage and display.
     */
    it("should trim whitespace", () => {
      // ARRANGE: Create input with extra whitespace
      const input = "  test string  ";

      // ACT: Sanitize the input
      const result = ValidationUtils.sanitizeString(input);

      // ASSERT: Verify whitespace is trimmed
      expect(result).toBe("test string");
    });
  });

  describe("validatePagination", () => {
    it("should return valid pagination parameters", () => {
      const result = ValidationUtils.validatePagination(2, 20);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it("should handle invalid page number", () => {
      const result = ValidationUtils.validatePagination(-1, 20);
      expect(result.page).toBe(1);
    });

    it("should limit maximum page size", () => {
      const result = ValidationUtils.validatePagination(1, 200);
      expect(result.limit).toBe(100);
    });
  });

  describe("isPositiveInteger", () => {
    it("should return true for positive integers", () => {
      expect(ValidationUtils.isPositiveInteger(1)).toBe(true);
      expect(ValidationUtils.isPositiveInteger(100)).toBe(true);
    });

    it("should return false for non-positive numbers", () => {
      expect(ValidationUtils.isPositiveInteger(0)).toBe(false);
      expect(ValidationUtils.isPositiveInteger(-1)).toBe(false);
      expect(ValidationUtils.isPositiveInteger(1.5)).toBe(false);
    });
  });

  describe("validateId", () => {
    it("should validate positive integer IDs", () => {
      expect(ValidationUtils.validateId(1).valid).toBe(true);
      expect(ValidationUtils.validateId("123").valid).toBe(true);
    });

    it("should reject invalid IDs", () => {
      expect(ValidationUtils.validateId(0).valid).toBe(false);
      expect(ValidationUtils.validateId(-1).valid).toBe(false);
      expect(ValidationUtils.validateId("abc").valid).toBe(false);
    });
  });
});
