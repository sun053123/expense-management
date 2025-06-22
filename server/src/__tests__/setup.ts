/**
 * Jest Test Setup Configuration
 *
 * This file configures the global test environment for all Jest tests in the application.
 * It sets up mocks, environment variables, and test lifecycle hooks to ensure
 * consistent, isolated, and reliable test execution.
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding global test setup and configuration
 * - Learning why and how to mock external dependencies
 * - Grasping test isolation principles and best practices
 * - Recognizing the importance of consistent test environments
 * - Understanding Jest lifecycle hooks and their purposes
 *
 * GLOBAL MOCKING STRATEGY:
 * We mock external dependencies at the global level to:
 * 1. Prevent real database connections during testing
 * 2. Avoid external API calls that could fail or be slow
 * 3. Ensure deterministic test results
 * 4. Speed up test execution significantly
 * 5. Enable testing without external service dependencies
 */

/**
 * DATABASE MOCKING STRATEGY
 *
 * We mock the database layer to achieve complete test isolation from the database.
 * This is crucial because:
 * - Tests should not depend on external database state
 * - Database operations are slow and would make tests sluggish
 * - Tests should be deterministic and not affected by data changes
 * - We can control exactly what data is "returned" from queries
 * - Multiple developers can run tests without database setup
 */

// Mock PostgreSQL database module for tests
jest.mock("../database/postgres", () => ({
  __esModule: true, // Indicates this is an ES module
  default: {
    // Mock all database query methods
    query: jest.fn(), // For SELECT queries returning multiple rows
    queryOne: jest.fn(), // For SELECT queries returning single row
    getClient: jest.fn(), // For getting database client connections
    transaction: jest.fn(), // For database transaction handling
    end: jest.fn(), // For closing database connections
  },
  DatabaseHelpers: {
    // Mock database utility functions
    buildWhereClause: jest.fn(), // For building SQL WHERE clauses
    buildUpdateClause: jest.fn(), // For building SQL UPDATE clauses
    formatError: jest.fn(), // For formatting database errors
  },
}));

/**
 * POSTGRESQL DRIVER MOCKING
 *
 * We mock the 'pg' (node-postgres) module to prevent any actual database
 * connections from being established during testing. This ensures that:
 * - No real database connections are attempted
 * - Tests don't fail due to missing database configuration
 * - Connection pooling doesn't interfere with test execution
 */
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(), // Mock connection establishment
    query: jest.fn(), // Mock query execution
    end: jest.fn(), // Mock connection termination
    on: jest.fn(), // Mock event listener registration
  })),
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(), // Mock client connection
    query: jest.fn(), // Mock client query execution
    end: jest.fn(), // Mock client disconnection
    on: jest.fn(), // Mock client event listeners
  })),
}));

/**
 * LOGGING MOCKING STRATEGY
 *
 * We mock the logger to prevent console output during tests because:
 * - Test output should be clean and focused on test results
 * - Log messages can clutter test output and make debugging harder
 * - We don't need to test the logging library itself
 * - Mocking allows us to verify that logging calls are made when needed
 */
jest.mock("../utils/logger", () => ({
  info: jest.fn(), // Mock info level logging
  error: jest.fn(), // Mock error level logging
  warn: jest.fn(), // Mock warning level logging
  debug: jest.fn(), // Mock debug level logging
  http: jest.fn(), // Mock HTTP request logging
}));

/**
 * TEST ENVIRONMENT CONFIGURATION
 *
 * Setting up environment variables ensures that tests run in a controlled
 * environment with predictable configuration values. This prevents tests
 * from being affected by developer's local environment settings.
 */

// Set test environment variables
process.env.NODE_ENV = "test"; // Ensures application runs in test mode
process.env.JWT_SECRET = "test-jwt-secret"; // Predictable JWT secret for testing
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"; // Test database URL

/**
 * JEST LIFECYCLE HOOKS
 *
 * These hooks run at different stages of the test lifecycle to ensure
 * proper setup, cleanup, and isolation between tests. Understanding
 * when each hook runs is crucial for effective testing.
 *
 * HOOK EXECUTION ORDER:
 * 1. beforeAll - Runs once before all tests in this file
 * 2. beforeEach - Runs before each individual test
 * 3. [TEST EXECUTION]
 * 4. afterEach - Runs after each individual test
 * 5. afterAll - Runs once after all tests in this file
 */

/**
 * GLOBAL SETUP HOOK
 *
 * This hook runs once before all tests begin. Use it for:
 * - Setting up test databases or external services
 * - Initializing global test data
 * - Configuring test environment settings
 * - Starting mock servers or services
 */
beforeAll(async () => {
  // Any global setup can go here
  // Examples:
  // - Initialize test database
  // - Start mock external services
  // - Set up global test fixtures
});

/**
 * GLOBAL CLEANUP HOOK
 *
 * This hook runs once after all tests complete. Use it for:
 * - Cleaning up test databases
 * - Stopping mock servers
 * - Releasing global resources
 * - Final cleanup operations
 */
afterAll(async () => {
  // Any global cleanup can go here
  // Examples:
  // - Close database connections
  // - Stop mock servers
  // - Clean up temporary files
});

/**
 * PRE-TEST SETUP HOOK
 *
 * This hook runs before EACH individual test. It's crucial for test isolation.
 * We clear all mocks to ensure each test starts with a clean slate.
 *
 * WHY CLEAR MOCKS:
 * - Prevents test interdependence
 * - Ensures predictable mock behavior
 * - Avoids false positives/negatives from previous tests
 * - Maintains test isolation principles
 */
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  // This clears:
  // - Mock call history
  // - Mock return values
  // - Mock implementation overrides
});

/**
 * POST-TEST CLEANUP HOOK
 *
 * This hook runs after EACH individual test. Use it for:
 * - Restoring original implementations
 * - Cleaning up test-specific resources
 * - Resetting global state
 * - Ensuring clean state for next test
 */
afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
  // This restores original implementations that were mocked
  // during the test (if any manual mocking was done)
});

/**
 * SETUP VERIFICATION TEST
 *
 * This test verifies that the test environment is properly configured.
 * It's a simple sanity check to ensure our setup is working correctly.
 *
 * WHY THIS TEST EXISTS:
 * - Jest requires at least one test to run successfully
 * - Provides immediate feedback if setup is broken
 * - Documents expected environment configuration
 * - Serves as a basic smoke test for the test environment
 */
describe("Setup", () => {
  it("should setup test environment", () => {
    // Verify that environment is correctly set to test mode
    expect(process.env.NODE_ENV).toBe("test");

    // This test ensures that:
    // - Environment variables are properly set
    // - Jest is running in the correct mode
    // - Basic test infrastructure is working
  });
});
