/**
 * TransactionService Test Suite
 *
 * This comprehensive test suite validates the transaction service layer,
 * which handles all business logic for financial transaction operations.
 *
 * TESTING STRATEGY:
 * - Mock the TransactionRepository to isolate business logic testing
 * - Test both success and failure scenarios for each operation
 * - Validate input validation and data transformation
 * - Ensure proper error handling and consistent response formats
 * - Test edge cases and boundary conditions
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding service layer testing patterns in clean architecture
 * - Learning how to mock repository dependencies effectively
 * - Grasping business logic validation and error handling
 * - Recognizing financial data handling best practices
 * - Understanding transaction lifecycle management
 */

import { TransactionService } from "../../services/TransactionService";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import {
  TransactionInput,
  TransactionFilter,
  TransactionType,
} from "../../types";

/**
 * MOCKING STRATEGY EXPLANATION:
 *
 * We mock external dependencies to achieve test isolation:
 *
 * 1. TransactionRepository: Mocked to avoid database operations
 *    - Allows us to control what data is "returned" from the database
 *    - Enables testing of business logic without database setup
 *    - Speeds up test execution significantly
 *    - Prevents test failures due to database connectivity issues
 *
 * 2. Logger: Mocked to avoid console output during testing
 *    - Keeps test output clean and focused
 *    - Prevents log pollution in test results
 */
jest.mock("../../repositories/TransactionRepository");
jest.mock("../../utils/logger");

const MockedTransactionRepository = jest.mocked(TransactionRepository);

/**
 * Test suite for TransactionService
 *
 * This test suite covers all business logic in the refactored TransactionService,
 * ensuring proper validation, error handling, and service layer functionality.
 * Tests are organized by method and cover both success and failure scenarios.
 */

/**
 * INTERFACE DEFINITION FOR BETTER TYPE SAFETY:
 *
 * We define this interface to ensure our mock repository has all the
 * methods we expect, providing better IDE support and catching errors early.
 */
interface MockedRepositoryMethods {
  findById: jest.Mock;
  findByUserId: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  getSummary: jest.Mock;
}

/**
 * Main test suite for TransactionService
 *
 * This describe block groups all TransactionService tests and provides
 * shared setup that runs before each individual test case.
 */
describe("TransactionService", () => {
  let transactionService: TransactionService;
  let mockRepository: MockedRepositoryMethods;

  /**
   * TEST SETUP (beforeEach):
   *
   * This setup runs before EACH test case to ensure test isolation.
   * Each test starts with a clean slate, preventing test interdependence.
   *
   * SETUP STEPS:
   * 1. Clear all mock call history and return values
   * 2. Create fresh mock repository methods
   * 3. Configure the mocked TransactionRepository constructor
   * 4. Initialize the service under test
   */
  beforeEach(() => {
    // Clear all mocks to prevent test pollution
    jest.clearAllMocks();

    // Create mock repository methods with Jest mock functions
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSummary: jest.fn(),
    };

    // Mock the TransactionRepository constructor to return our mock
    // This allows us to control the repository's behavior in our tests
    MockedTransactionRepository.mockImplementation(() => mockRepository as any);

    // Create a new service instance for each test
    transactionService = new TransactionService();
  });

  /**
   * GET TRANSACTIONS TESTS
   *
   * These tests validate the transaction retrieval functionality, which is
   * one of the most commonly used features in the application. The tests cover:
   * - Basic transaction retrieval without filters
   * - Filtered transaction retrieval (by type, date range)
   * - Input validation for user IDs and filters
   * - Error handling for repository failures
   *
   * BUSINESS LOGIC FOCUS:
   * - User can only access their own transactions (security)
   * - Filters are properly validated before database queries
   * - Consistent error handling and response format
   */
  describe("getTransactions", () => {
    /**
     * TEST DATA SETUP:
     *
     * We create realistic transaction data that represents different
     * transaction types (INCOME/EXPENSE) to test filtering functionality.
     */
    const userId = 1;
    const mockTransactions = [
      {
        id: 1,
        userId: 1,
        type: "EXPENSE" as const,
        amount: 100.5,
        description: "Test expense",
        date: new Date("2023-12-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        type: "INCOME" as const,
        amount: 500.0,
        description: "Test income",
        date: new Date("2023-12-02"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    /**
     * TEST CASE: Basic Transaction Retrieval (Happy Path)
     *
     * This test validates the most common use case: retrieving all
     * transactions for a user without any filters applied.
     */
    it("should successfully retrieve transactions without filter", async () => {
      // ARRANGE: Mock repository to return test transactions
      mockRepository.findByUserId.mockResolvedValue(mockTransactions);

      // ACT: Call the service method
      const result = await transactionService.getTransactions(userId);

      // ASSERT: Verify successful retrieval
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransactions);

      // Verify repository was called with correct parameters
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        undefined // No filter provided
      );
    });

    /**
     * TEST CASE: Filtered Transaction Retrieval
     *
     * This test validates the filtering functionality, which allows users
     * to narrow down their transaction results by type and date range.
     */
    it("should successfully retrieve transactions with filter", async () => {
      // ARRANGE: Create a filter object for testing
      const filter: TransactionFilter = {
        type: "EXPENSE" as const,
        startDate: "2023-01-01",
        endDate: "2023-12-31",
      };

      // Mock repository to return filtered results (only expenses)
      mockRepository.findByUserId.mockResolvedValue([mockTransactions[0]]);

      // ACT: Call service with filter
      const result = await transactionService.getTransactions(userId, filter);

      // ASSERT: Verify filtered results
      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockTransactions[0]]);

      // Verify filter was passed to repository
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, filter);
    });

    /**
     * TEST CASE: Invalid User ID Validation
     *
     * This test ensures that invalid user IDs are rejected before
     * any database operations are performed. This is important for
     * both security and performance.
     */
    it("should reject invalid user ID", async () => {
      // ARRANGE: No setup needed

      // ACT: Call service with invalid user ID (0)
      const result = await transactionService.getTransactions(0);

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain("User ID must be positive");

      // Verify repository was not called (early validation)
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
    });

    /**
     * TEST CASE: Invalid Filter Validation
     *
     * This test ensures that invalid filter parameters are caught
     * before database queries, preventing potential errors and
     * improving user experience with clear error messages.
     */
    it("should reject invalid filter", async () => {
      // ARRANGE: Create invalid filter with bad transaction type
      const invalidFilter: TransactionFilter = {
        type: "INVALID" as TransactionType,
      };

      // ACT: Call service with invalid filter
      const result = await transactionService.getTransactions(
        userId,
        invalidFilter
      );

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Transaction type must be either INCOME or EXPENSE"
      );

      // Verify repository was not called (early validation)
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
    });

    /**
     * TEST CASE: Repository Error Handling
     *
     * This test ensures that database errors are properly caught
     * and converted to user-friendly error messages. This is crucial
     * for application stability and user experience.
     */
    it("should handle repository errors", async () => {
      // ARRANGE: Mock repository to throw an error
      mockRepository.findByUserId.mockRejectedValue(
        new Error("Database error")
      );

      // ACT: Call service (will trigger repository error)
      const result = await transactionService.getTransactions(userId);

      // ASSERT: Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "An error occurred while retrieving transactions"
      );
      // Note: Generic error message protects system internals from users
    });
  });

  /**
   * GET SINGLE TRANSACTION TESTS
   *
   * These tests validate the single transaction retrieval functionality.
   * This is typically used for transaction detail views or edit forms.
   * Key security consideration: Users can only access their own transactions.
   *
   * SECURITY FOCUS:
   * - Authorization: Users can only access transactions they own
   * - Input validation: Transaction and user IDs must be valid
   * - Error handling: Clear messages without exposing system internals
   */
  describe("getTransaction", () => {
    /**
     * TEST DATA SETUP:
     *
     * Single transaction data for testing individual transaction retrieval.
     */
    const transactionId = 1;
    const userId = 1;
    const mockTransaction = {
      id: 1,
      userId: 1,
      type: "EXPENSE" as const,
      amount: 100.5,
      description: "Test expense",
      date: new Date("2023-12-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * TEST CASE: Successful Transaction Retrieval (Happy Path)
     *
     * This test validates the basic functionality of retrieving a single
     * transaction that belongs to the requesting user.
     */
    it("should successfully retrieve transaction", async () => {
      // ARRANGE: Mock repository to return the transaction
      mockRepository.findById.mockResolvedValue(mockTransaction);

      // ACT: Retrieve the transaction
      const result = await transactionService.getTransaction(
        transactionId,
        userId
      );

      // ASSERT: Verify successful retrieval
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransaction);

      // Verify repository was called with correct ID
      expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
    });

    /**
     * TEST CASE: Invalid Transaction ID Validation
     *
     * This test ensures that invalid transaction IDs are rejected
     * before database operations, improving performance and security.
     */
    it("should reject invalid transaction ID", async () => {
      // ARRANGE: No setup needed

      // ACT: Call with invalid transaction ID
      const result = await transactionService.getTransaction(0, userId);

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain("Transaction ID must be positive");

      // Verify no database call was made
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    /**
     * TEST CASE: Invalid User ID Validation
     *
     * Similar to transaction ID validation, user ID must be valid
     * before any database operations are performed.
     */
    it("should reject invalid user ID", async () => {
      // ARRANGE: No setup needed

      // ACT: Call with invalid user ID
      const result = await transactionService.getTransaction(transactionId, 0);

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toContain("User ID must be positive");

      // Verify no database call was made
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    /**
     * TEST CASE: Transaction Not Found
     *
     * This test handles the case where a transaction ID doesn't exist
     * in the database. This could happen if the transaction was deleted
     * or if the user provides an incorrect ID.
     */
    it("should return error when transaction not found", async () => {
      // ARRANGE: Mock repository to return null (not found)
      mockRepository.findById.mockResolvedValue(null);

      // ACT: Attempt to retrieve non-existent transaction
      const result = await transactionService.getTransaction(
        transactionId,
        userId
      );

      // ASSERT: Verify not found error
      expect(result.success).toBe(false);
      expect(result.error).toBe("Transaction not found");
    });

    /**
     * TEST CASE: Authorization Check (Security Critical)
     *
     * This is a crucial security test that ensures users cannot access
     * transactions belonging to other users. This prevents unauthorized
     * data access and maintains data privacy.
     */
    it("should reject access to transaction owned by different user", async () => {
      // ARRANGE: Create transaction owned by different user
      const otherUserTransaction = { ...mockTransaction, userId: 2 };
      mockRepository.findById.mockResolvedValue(otherUserTransaction);

      // ACT: Attempt to access other user's transaction
      const result = await transactionService.getTransaction(
        transactionId,
        userId
      );

      // ASSERT: Verify access denied
      expect(result.success).toBe(false);
      expect(result.error).toBe("Access denied");
      // This is a security feature - users can only access their own data
    });

    /**
     * TEST CASE: Repository Error Handling
     *
     * This test ensures database errors are properly handled and
     * don't crash the application or expose internal details.
     */
    it("should handle repository errors", async () => {
      // ARRANGE: Mock repository to throw error
      mockRepository.findById.mockRejectedValue(new Error("Database error"));

      // ACT: Call service (will trigger error)
      const result = await transactionService.getTransaction(
        transactionId,
        userId
      );

      // ASSERT: Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "An error occurred while retrieving the transaction"
      );
      // Generic error message protects system internals
    });
  });

  describe("createTransaction", () => {
    const userId = 1;
    const validInput: TransactionInput = {
      type: "EXPENSE" as const,
      amount: 100.5,
      description: "Test expense",
      date: "2023-12-01",
    };

    const mockCreatedTransaction = {
      id: 1,
      userId: 1,
      type: "EXPENSE" as const,
      amount: 100.5,
      description: "Test expense",
      date: new Date("2023-12-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should successfully create transaction", async () => {
      mockRepository.create.mockResolvedValue(mockCreatedTransaction);

      const result = await transactionService.createTransaction(
        userId,
        validInput
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedTransaction);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        type: validInput.type,
        amount: validInput.amount,
        description: validInput.description,
        date: new Date(validInput.date),
      });
    });

    it("should successfully create transaction without description", async () => {
      const inputWithoutDescription = { ...validInput };
      delete inputWithoutDescription.description;

      const expectedTransaction = {
        ...mockCreatedTransaction,
        description: null,
      };
      mockRepository.create.mockResolvedValue(expectedTransaction);

      const result = await transactionService.createTransaction(
        userId,
        inputWithoutDescription
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedTransaction);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        type: inputWithoutDescription.type,
        amount: inputWithoutDescription.amount,
        description: null,
        date: new Date(inputWithoutDescription.date),
      });
    });

    it("should reject invalid user ID", async () => {
      const result = await transactionService.createTransaction(0, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain("User ID must be positive");
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should reject invalid transaction input", async () => {
      const invalidInput = {
        ...validInput,
        amount: -100, // Invalid negative amount
      };

      const result = await transactionService.createTransaction(
        userId,
        invalidInput
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Amount must be a positive number");
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      mockRepository.create.mockRejectedValue(new Error("Database error"));

      const result = await transactionService.createTransaction(
        userId,
        validInput
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "An error occurred while creating the transaction"
      );
    });
  });

  describe("updateTransaction", () => {
    const transactionId = 1;
    const userId = 1;
    const existingTransaction = {
      id: 1,
      userId: 1,
      type: "EXPENSE" as const,
      amount: 100.5,
      description: "Original expense",
      date: new Date("2023-12-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should successfully update transaction", async () => {
      const updateInput = {
        amount: 150.75,
        description: "Updated expense",
      };

      const updatedTransaction = {
        ...existingTransaction,
        amount: 150.75,
        description: "Updated expense",
      };

      mockRepository.findById.mockResolvedValue(existingTransaction);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      const result = await transactionService.updateTransaction(
        transactionId,
        userId,
        updateInput
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedTransaction);
      expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockRepository.update).toHaveBeenCalledWith(transactionId, {
        amount: 150.75,
        description: "Updated expense",
      });
    });

    it("should reject invalid transaction ID", async () => {
      const result = await transactionService.updateTransaction(0, userId, {
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Transaction ID must be positive");
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it("should return error when transaction not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await transactionService.updateTransaction(
        transactionId,
        userId,
        { amount: 100 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Transaction not found");
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should reject access to transaction owned by different user", async () => {
      const otherUserTransaction = { ...existingTransaction, userId: 2 };
      mockRepository.findById.mockResolvedValue(otherUserTransaction);

      const result = await transactionService.updateTransaction(
        transactionId,
        userId,
        { amount: 100 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Access denied");
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should reject invalid update input", async () => {
      const invalidInput = {
        amount: -100, // Invalid negative amount
      };

      const result = await transactionService.updateTransaction(
        transactionId,
        userId,
        invalidInput
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Amount must be a positive number");
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it("should reject empty update input", async () => {
      const result = await transactionService.updateTransaction(
        transactionId,
        userId,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "At least one field must be provided for update"
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("deleteTransaction", () => {
    const transactionId = 1;
    const userId = 1;
    const existingTransaction = {
      id: 1,
      userId: 1,
      type: "EXPENSE" as const,
      amount: 100.5,
      description: "Test expense",
      date: new Date("2023-12-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should successfully delete transaction", async () => {
      mockRepository.findById.mockResolvedValue(existingTransaction);
      mockRepository.delete.mockResolvedValue(true);

      const result = await transactionService.deleteTransaction(
        transactionId,
        userId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockRepository.delete).toHaveBeenCalledWith(transactionId);
    });

    it("should reject invalid transaction ID", async () => {
      const result = await transactionService.deleteTransaction(0, userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Transaction ID must be positive");
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it("should return error when transaction not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await transactionService.deleteTransaction(
        transactionId,
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Transaction not found");
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it("should reject access to transaction owned by different user", async () => {
      const otherUserTransaction = { ...existingTransaction, userId: 2 };
      mockRepository.findById.mockResolvedValue(otherUserTransaction);

      const result = await transactionService.deleteTransaction(
        transactionId,
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Access denied");
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it("should handle repository delete failure", async () => {
      mockRepository.findById.mockResolvedValue(existingTransaction);
      mockRepository.delete.mockResolvedValue(false);

      const result = await transactionService.deleteTransaction(
        transactionId,
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to delete transaction");
    });
  });

  describe("getSummary", () => {
    const userId = 1;
    const mockSummary = {
      totalIncome: 1000.0,
      totalExpense: 500.0,
      balance: 500.0,
      transactionCount: 10,
    };

    it("should successfully retrieve summary", async () => {
      mockRepository.getSummary.mockResolvedValue(mockSummary);

      const result = await transactionService.getSummary(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
      expect(mockRepository.getSummary).toHaveBeenCalledWith(userId);
    });

    it("should reject invalid user ID", async () => {
      const result = await transactionService.getSummary(0);

      expect(result.success).toBe(false);
      expect(result.error).toContain("User ID must be positive");
      expect(mockRepository.getSummary).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      mockRepository.getSummary.mockRejectedValue(new Error("Database error"));

      const result = await transactionService.getSummary(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "An error occurred while retrieving the summary"
      );
    });
  });
});
