/**
 * TransactionValidation Test Suite (Zod Schema-Based)
 *
 * This comprehensive test suite validates the modern Zod-based validation system
 * for transaction operations. Zod provides type-safe, runtime validation with
 * excellent TypeScript integration and detailed error reporting.
 *
 * TESTING STRATEGY:
 * - Test schema validation for all transaction operations (create, update, filter)
 * - Validate comprehensive input scenarios and edge cases
 * - Test error message formatting and user experience
 * - Ensure type safety and runtime validation alignment
 * - Test performance with various input sizes and types
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding modern schema-based validation patterns
 * - Learning Zod library usage and benefits
 * - Grasping type-safe validation techniques
 * - Recognizing validation error handling best practices
 * - Understanding the evolution from manual to schema validation
 *
 * ZOD BENEFITS OVER MANUAL VALIDATION:
 * - Type safety: Validation schemas match TypeScript types
 * - Composability: Schemas can be combined and reused
 * - Better error messages: Detailed, path-specific error reporting
 * - Maintainability: Single source of truth for validation rules
 * - Performance: Optimized validation with early returns
 */

import { TransactionValidation } from "../../validation/transaction.schemas";

/**
 * Test suite for transaction validation schemas using Zod
 *
 * This test suite covers all validation scenarios for the new Zod-based
 * validation system, ensuring comprehensive input validation and proper
 * error handling for transaction operations.
 */
describe("TransactionValidation", () => {
  /**
   * TRANSACTION INPUT VALIDATION TESTS
   *
   * These tests validate the core transaction creation schema, which is
   * the most critical validation in the application. Every new transaction
   * must pass this validation to ensure data integrity.
   *
   * SCHEMA VALIDATION AREAS:
   * - Type validation with literal types for transaction types
   * - Numeric validation with precision and range constraints
   * - Date validation with format and range checking
   * - String validation with length limits and sanitization
   * - Optional field handling and default values
   */
  describe("validateTransactionInput", () => {
    /**
     * TEST CASE: Valid Transaction Input (Happy Path)
     *
     * This test validates that properly formatted transaction data
     * passes Zod schema validation and returns the expected structure.
     * This represents the most common successful use case.
     */
    it("should validate correct transaction input", () => {
      // ARRANGE: Create valid transaction input matching schema
      const input = {
        type: "EXPENSE" as const,
        amount: 100.5,
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate using Zod schema
      const result = TransactionValidation.validateTransactionInput(input);

      // ASSERT: Verify successful validation
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
      // Zod returns the parsed data, which may include transformations
    });

    /**
     * TEST CASE: Optional Description Field
     *
     * This test validates that the description field is properly handled
     * as optional in the Zod schema. This demonstrates schema flexibility
     * and proper handling of undefined values.
     */
    it("should validate transaction without description", () => {
      // ARRANGE: Create input without optional description field
      const input = {
        type: "INCOME" as const,
        amount: 250.75,
        date: "2023-12-01",
        // description is intentionally omitted
      };

      // ACT: Validate using Zod schema
      const result = TransactionValidation.validateTransactionInput(input);

      // ASSERT: Verify successful validation with undefined description
      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
      // Zod properly handles optional fields
    });

    /**
     * TEST CASE: Invalid Transaction Type (Literal Type Validation)
     *
     * This test demonstrates Zod's literal type validation, which ensures
     * only specific string values are accepted. This is more type-safe
     * than traditional string validation.
     */
    it("should reject invalid transaction type", () => {
      // ARRANGE: Create input with invalid transaction type
      const input = {
        type: "INVALID" as any, // Not in literal union "INCOME" | "EXPENSE"
        amount: 100.5,
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate using Zod schema
      const result = TransactionValidation.validateTransactionInput(input);

      // ASSERT: Verify validation fails with type error
      expect(result.success).toBe(false);

      // Format Zod errors for user-friendly messages
      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Transaction type must be either INCOME or EXPENSE")
        )
      ).toBe(true);
    });

    /**
     * TEST CASE: Negative Amount Validation (Numeric Constraints)
     *
     * This test validates Zod's numeric constraint validation, ensuring
     * amounts are positive. Zod provides built-in numeric validators
     * that are more robust than manual checks.
     */
    it("should reject negative amount", () => {
      // ARRANGE: Create input with negative amount
      const input = {
        type: "EXPENSE" as const,
        amount: -100, // Violates positive constraint
        description: "Test transaction",
        date: "2023-12-01",
      };

      // ACT: Validate using Zod schema
      const result = TransactionValidation.validateTransactionInput(input);

      // ASSERT: Verify validation fails with amount error
      expect(result.success).toBe(false);

      // Check formatted error messages
      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Amount must be a positive number")
        )
      ).toBe(true);
    });

    it("should reject zero amount", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 0,
        description: "Test transaction",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Amount must be a positive number")
        )
      ).toBe(true);
    });

    it("should reject amount that exceeds maximum", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 1000000,
        description: "Test transaction",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Amount cannot exceed 999,999.99")
        )
      ).toBe(true);
    });

    it("should reject amount with more than 2 decimal places", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 100.123,
        description: "Test transaction",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Amount cannot have more than 2 decimal places")
        )
      ).toBe(true);
    });

    it("should reject invalid date format", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 100,
        description: "Test transaction",
        date: "invalid-date",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) => error.includes("Invalid date format"))
      ).toBe(true);
    });

    it("should reject date too far in the future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const input = {
        type: "EXPENSE" as const,
        amount: 100,
        description: "Test transaction",
        date: futureDate.toISOString().split("T")[0],
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Date cannot be more than 1 year in the future")
        )
      ).toBe(true);
    });

    it("should reject description that is too long", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 100,
        description: "a".repeat(501),
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Description cannot exceed 500 characters")
        )
      ).toBe(true);
    });

    it("should handle empty description by converting to undefined", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 100,
        description: "",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
    });

    it("should trim whitespace from description", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: 100,
        description: "  Test transaction  ",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBe("Test transaction");
    });

    it("should reject missing required fields", () => {
      const input = {
        amount: 100,
        description: "Test transaction",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(errors.some((error) => error.includes("type"))).toBe(true);
    });

    it("should reject non-number amount", () => {
      const input = {
        type: "EXPENSE" as const,
        amount: "100" as any,
        description: "Test transaction",
        date: "2023-12-01",
      };

      const result = TransactionValidation.validateTransactionInput(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) => error.includes("Amount must be a number"))
      ).toBe(true);
    });
  });

  describe("validateTransactionUpdate", () => {
    it("should validate partial update with single field", () => {
      const input = {
        amount: 150.25,
      };

      const result = TransactionValidation.validateTransactionUpdate(input);
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(150.25);
    });

    it("should validate partial update with multiple fields", () => {
      const input = {
        type: "INCOME" as const,
        amount: 200,
        description: "Updated transaction",
      };

      const result = TransactionValidation.validateTransactionUpdate(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
    });

    it("should reject empty update object", () => {
      const input = {};

      const result = TransactionValidation.validateTransactionUpdate(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("At least one field must be provided for update")
        )
      ).toBe(true);
    });

    it("should validate update with undefined description (to clear it)", () => {
      const input = {
        description: undefined,
      };

      const result = TransactionValidation.validateTransactionUpdate(input);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
    });

    it("should reject invalid values in update", () => {
      const input = {
        amount: -50,
      };

      const result = TransactionValidation.validateTransactionUpdate(input);
      expect(result.success).toBe(false);

      const errors = TransactionValidation.formatValidationErrors(
        result.error!
      );
      expect(
        errors.some((error) =>
          error.includes("Amount must be a positive number")
        )
      ).toBe(true);
    });
  });

  describe("validateTransactionFilter", () => {
    it("should validate empty filter", () => {
      const filter = {};

      const result = TransactionValidation.validateTransactionFilter(filter);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("should validate filter with type only", () => {
      const filter = {
        type: "EXPENSE" as const,
      };

      const result = TransactionValidation.validateTransactionFilter(filter);
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe("EXPENSE" as const);
    });

    it("should validate filter with date range", () => {
      const filter = {
        startDate: "2023-01-01",
        endDate: "2023-12-31",
      };

      const result = TransactionValidation.validateTransactionFilter(filter);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(filter);
    });

    describe("validateTransactionId", () => {
      it("should validate positive integer ID", () => {
        const result = TransactionValidation.validateTransactionId(123);
        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(123);
      });

      it("should reject zero ID", () => {
        const result = TransactionValidation.validateTransactionId(0);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) =>
            error.includes("Transaction ID must be positive")
          )
        ).toBe(true);
      });

      it("should reject negative ID", () => {
        const result = TransactionValidation.validateTransactionId(-1);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) =>
            error.includes("Transaction ID must be positive")
          )
        ).toBe(true);
      });

      it("should reject decimal ID", () => {
        const result = TransactionValidation.validateTransactionId(1.5);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) =>
            error.includes("Transaction ID must be an integer")
          )
        ).toBe(true);
      });

      it("should reject non-number ID", () => {
        const result = TransactionValidation.validateTransactionId(
          "abc" as any
        );
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) =>
            error.includes("Transaction ID must be a number")
          )
        ).toBe(true);
      });
    });

    describe("validateUserId", () => {
      it("should validate positive integer user ID", () => {
        const result = TransactionValidation.validateUserId(456);
        expect(result.success).toBe(true);
        expect(result.data?.userId).toBe(456);
      });

      it("should reject zero user ID", () => {
        const result = TransactionValidation.validateUserId(0);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) => error.includes("User ID must be positive"))
        ).toBe(true);
      });

      it("should reject negative user ID", () => {
        const result = TransactionValidation.validateUserId(-1);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) => error.includes("User ID must be positive"))
        ).toBe(true);
      });
    });

    describe("validatePagination", () => {
      it("should validate correct pagination parameters", () => {
        const input = { page: 2, limit: 20 };
        const result = TransactionValidation.validatePagination(input);
        expect(result.success).toBe(true);
        expect(result.data?.page).toBe(2);
        expect(result.data?.limit).toBe(20);
      });

      it("should use default values when not provided", () => {
        const input = {};
        const result = TransactionValidation.validatePagination(input);
        expect(result.success).toBe(true);
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(10);
      });

      it("should reject page less than 1", () => {
        const input = { page: 0 };
        const result = TransactionValidation.validatePagination(input);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) => error.includes("Page must be at least 1"))
        ).toBe(true);
      });

      it("should reject limit greater than 100", () => {
        const input = { limit: 150 };
        const result = TransactionValidation.validatePagination(input);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) => error.includes("Limit cannot exceed 100"))
        ).toBe(true);
      });

      it("should reject non-integer page", () => {
        const input = { page: 1.5 };
        const result = TransactionValidation.validatePagination(input);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(
          errors.some((error) => error.includes("Page must be an integer"))
        ).toBe(true);
      });
    });

    describe("formatValidationErrors", () => {
      it("should format errors with field paths", () => {
        const input = {
          type: "INVALID" as any,
          amount: -100,
        };

        const result = TransactionValidation.validateTransactionInput(input);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.includes("type:"))).toBe(true);
        expect(errors.some((error) => error.includes("amount:"))).toBe(true);
      });

      it("should handle errors without field paths", () => {
        const input = {};
        const result = TransactionValidation.validateTransactionUpdate(input);
        expect(result.success).toBe(false);

        const errors = TransactionValidation.formatValidationErrors(
          result.error!
        );
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).not.toContain(":");
      });
    });

    describe("sanitizeString", () => {
      it("should remove dangerous characters", () => {
        const input = '<script>alert("xss")</script>';
        const result = TransactionValidation.sanitizeString(input);
        expect(result).toBe('scriptalert("xss")/script');
      });

      it("should trim whitespace", () => {
        const input = "  test string  ";
        const result = TransactionValidation.sanitizeString(input);
        expect(result).toBe("test string");
      });

      it("should normalize multiple spaces", () => {
        const input = "test    multiple   spaces";
        const result = TransactionValidation.sanitizeString(input);
        expect(result).toBe("test multiple spaces");
      });

      it("should handle empty string", () => {
        const input = "";
        const result = TransactionValidation.sanitizeString(input);
        expect(result).toBe("");
      });
    });

    describe("validateAndSanitizeDescription", () => {
      it("should return null for empty description", () => {
        const result = TransactionValidation.validateAndSanitizeDescription("");
        expect(result).toBeNull();
      });

      it("should return null for whitespace-only description", () => {
        const result =
          TransactionValidation.validateAndSanitizeDescription("   ");
        expect(result).toBeNull();
      });

      it("should return null for undefined description", () => {
        const result =
          TransactionValidation.validateAndSanitizeDescription(undefined);
        expect(result).toBeNull();
      });

      it("should sanitize and return valid description", () => {
        const input = "  Valid description  ";
        const result =
          TransactionValidation.validateAndSanitizeDescription(input);
        expect(result).toBe("Valid description");
      });

      it("should throw error for description that is too long", () => {
        const input = "a".repeat(501);
        expect(() => {
          TransactionValidation.validateAndSanitizeDescription(input);
        }).toThrow("Description cannot exceed 500 characters");
      });

      it("should sanitize dangerous characters in description", () => {
        const input = '<script>alert("xss")</script> Valid description';
        const result =
          TransactionValidation.validateAndSanitizeDescription(input);
        expect(result).toBe('scriptalert("xss")/script Valid description');
      });
    });
  });
});
