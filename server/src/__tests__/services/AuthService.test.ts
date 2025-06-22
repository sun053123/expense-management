/**
 * AuthService Test Suite
 *
 * This comprehensive test suite validates the authentication service layer,
 * which handles user login, registration, and token verification operations.
 *
 * TESTING STRATEGY:
 * - Mock external dependencies (UserRepository, AuthUtils) to isolate business logic
 * - Test both success and failure scenarios for each method
 * - Validate proper error handling and security measures
 * - Ensure consistent response format across all operations
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding service layer testing patterns
 * - Learning how to mock dependencies effectively
 * - Grasping authentication flow testing strategies
 * - Recognizing security testing best practices
 */

import { AuthService } from "../../services/AuthService";
import { UserRepository } from "../../repositories/UserRepository";
import { AuthUtils } from "../../utils/auth";

/**
 * MOCKING STRATEGY EXPLANATION:
 *
 * We mock external dependencies to achieve test isolation and control:
 *
 * 1. UserRepository: Mocked to avoid database calls during testing
 *    - Allows us to control what data is "returned" from the database
 *    - Enables testing of business logic without database setup
 *    - Speeds up test execution significantly
 *
 * 2. AuthUtils: Mocked to avoid actual cryptographic operations
 *    - Prevents real password hashing (slow and unnecessary in unit tests)
 *    - Allows us to control JWT token generation/verification
 *    - Enables testing of authentication logic without external dependencies
 */
jest.mock("../../repositories/UserRepository");
jest.mock("../../utils/auth");

// Type-safe mock declarations for better IDE support and type checking
const MockedUserRepository = UserRepository as jest.MockedClass<
  typeof UserRepository
>;
const MockedAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;

/**
 * Main test suite for AuthService
 *
 * This describe block groups all AuthService tests and provides shared setup
 * that runs before each individual test case.
 */
describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  /**
   * TEST SETUP (beforeEach):
   *
   * This setup runs before EACH test case to ensure test isolation.
   * Each test starts with a clean slate, preventing test interdependence.
   *
   * SETUP STEPS:
   * 1. Clear all mock call history and return values
   * 2. Create fresh mock instances
   * 3. Initialize the service under test
   * 4. Inject mocked dependencies
   */
  beforeEach(() => {
    // Clear all mocks to prevent test pollution
    jest.clearAllMocks();

    // Create a fresh mock repository instance for each test
    mockUserRepository =
      new MockedUserRepository() as jest.Mocked<UserRepository>;

    // Create the service instance we're testing
    authService = new AuthService();

    // Dependency injection: Replace the real repository with our mock
    // This allows us to control the repository's behavior in our tests
    (authService as any).userRepository = mockUserRepository;
  });

  /**
   * LOGIN METHOD TESTS
   *
   * The login method is critical for application security and user experience.
   * These tests validate the complete authentication flow including:
   * - Email/password validation
   * - User lookup in database
   * - Password verification
   * - JWT token generation
   * - Error handling for various failure scenarios
   *
   * TESTING APPROACH:
   * - Test the "happy path" (successful login)
   * - Test all possible failure scenarios
   * - Verify proper error messages are returned
   * - Ensure sensitive information is not leaked in responses
   */
  describe("login", () => {
    /**
     * TEST DATA SETUP:
     *
     * We define reusable test data at the describe block level to:
     * - Maintain consistency across related tests
     * - Make tests more readable and maintainable
     * - Clearly separate test data from test logic
     */
    const validEmail = "test@example.com";
    const validPassword = "password123";
    const hashedPassword = "hashedpassword";
    const mockUser = {
      id: 1,
      email: validEmail,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * TEST CASE: Successful Login (Happy Path)
     *
     * This test validates the complete successful authentication flow.
     * It's the most important test as it verifies the core functionality works.
     *
     * ARRANGE-ACT-ASSERT PATTERN:
     */
    it("should login successfully with valid credentials", async () => {
      // ARRANGE: Set up all the conditions for a successful login
      // Mock email validation to return true (valid email format)
      MockedAuthUtils.isValidEmail.mockReturnValue(true);

      // Mock repository to return a user (user exists in database)
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Mock password comparison to return true (password matches)
      MockedAuthUtils.comparePassword.mockResolvedValue(true);

      // Mock token generation to return a test token
      MockedAuthUtils.generateToken.mockReturnValue("jwt-token");

      // ACT: Execute the method under test
      const result = await authService.login(validEmail, validPassword);

      // ASSERT: Verify the expected outcomes
      // Check that login was successful
      expect(result.success).toBe(true);

      // Verify the response contains the expected data structure
      expect(result.data).toEqual({
        token: "jwt-token",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          // Note: password is excluded from response for security
        },
      });
    });

    /**
     * TEST CASE: Missing Email Validation
     *
     * This test ensures proper input validation for required fields.
     * Testing edge cases like empty strings helps prevent runtime errors.
     */
    it("should fail with missing email or password", async () => {
      // ARRANGE: No setup needed - testing with invalid input

      // ACT: Call login with empty email
      const result = await authService.login("", validPassword);

      // ASSERT: Verify proper error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe("email: Email is required");
    });

    /**
     * TEST CASE: Invalid Email Format
     *
     * This test validates email format checking before database operations.
     * It's important to validate input early to avoid unnecessary processing.
     */
    it("should fail with invalid email format", async () => {
      // ARRANGE: Mock email validation to return false
      MockedAuthUtils.isValidEmail.mockReturnValue(false);

      // ACT: Attempt login with invalid email format
      const result = await authService.login("invalid-email", validPassword);

      // ASSERT: Verify proper validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe("email: Please provide a valid email address");
    });

    /**
     * TEST CASE: Non-existent User
     *
     * This test validates behavior when a user doesn't exist in the database.
     * Note the generic error message - this is a security best practice to
     * prevent user enumeration attacks.
     */
    it("should fail with non-existent user", async () => {
      // ARRANGE: Set up scenario where user doesn't exist
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      // Mock repository to return null (user not found)
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // ACT: Attempt login with non-existent user
      const result = await authService.login(validEmail, validPassword);

      // ASSERT: Verify security-conscious error handling
      expect(result.success).toBe(false);
      // Generic message prevents revealing whether email exists
      expect(result.error).toBe("Invalid email or password");
    });

    /**
     * TEST CASE: Incorrect Password
     *
     * This test validates password verification logic.
     * Again, note the generic error message for security.
     */
    it("should fail with incorrect password", async () => {
      // ARRANGE: Set up scenario where user exists but password is wrong
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      // Mock password comparison to return false (passwords don't match)
      MockedAuthUtils.comparePassword.mockResolvedValue(false);

      // ACT: Attempt login with wrong password
      const result = await authService.login(validEmail, "wrongpassword");

      // ASSERT: Verify proper error handling
      expect(result.success).toBe(false);
      // Same generic message as non-existent user for security
      expect(result.error).toBe("Invalid email or password");
    });
  });

  /**
   * REGISTER METHOD TESTS
   *
   * User registration is a critical security operation that requires:
   * - Comprehensive input validation
   * - Password strength enforcement
   * - Duplicate email prevention
   * - Secure password hashing
   * - Proper error handling
   *
   * These tests ensure all security measures are properly implemented.
   */
  describe("register", () => {
    /**
     * TEST DATA SETUP:
     *
     * Registration test data includes a strong password that meets
     * all security requirements to test the happy path scenario.
     */
    const validEmail = "newuser@example.com";
    const validPassword = "Password123"; // Meets registration requirements: uppercase, lowercase, number
    const hashedPassword = "hashedpassword";

    /**
     * TEST CASE: Successful Registration (Happy Path)
     *
     * This test validates the complete user registration flow including
     * validation, password hashing, user creation, and token generation.
     */
    it("should register successfully with valid data", async () => {
      // ARRANGE: Set up all conditions for successful registration
      // Mock email format validation
      MockedAuthUtils.isValidEmail.mockReturnValue(true);

      // Mock password strength validation
      MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });

      // Mock repository to return null (email not already taken)
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Mock password hashing (security operation)
      MockedAuthUtils.hashPassword.mockResolvedValue(hashedPassword);

      // Create expected user object that would be returned from database
      const newUser = {
        id: 1,
        email: validEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock user creation in database
      mockUserRepository.create.mockResolvedValue(newUser);

      // Mock JWT token generation for immediate login
      MockedAuthUtils.generateToken.mockReturnValue("jwt-token");

      // ACT: Execute the registration
      const result = await authService.register(validEmail, validPassword);

      // ASSERT: Verify successful registration
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: "jwt-token",
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
          // Note: password hash is excluded from response for security
        },
      });
    });

    /**
     * TEST CASE: Missing Required Fields
     *
     * Input validation should catch missing required fields early.
     */
    it("should fail with missing email or password", async () => {
      // ARRANGE: No setup needed

      // ACT: Attempt registration with empty email
      const result = await authService.register("", validPassword);

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe("email: Email is required");
    });

    /**
     * TEST CASE: Invalid Email Format
     *
     * Email format validation prevents invalid data from entering the system.
     */
    it("should fail with invalid email format", async () => {
      // ARRANGE: Mock email validation to fail
      MockedAuthUtils.isValidEmail.mockReturnValue(false);

      // ACT: Attempt registration with invalid email
      const result = await authService.register("invalid-email", validPassword);

      // ASSERT: Verify validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe("email: Please provide a valid email address");
    });

    /**
     * TEST CASE: Weak Password Rejection
     *
     * Password strength validation is crucial for account security.
     * This test ensures weak passwords are rejected with helpful messages.
     */
    it("should fail with invalid password", async () => {
      // ARRANGE: Set up password validation to fail
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      MockedAuthUtils.isValidPassword.mockReturnValue({
        valid: false,
        message: "Password too short",
      });

      // ACT: Attempt registration with weak password
      const result = await authService.register(validEmail, "short");

      // ASSERT: Verify password validation error
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "password: Password must be at least 8 characters long"
      );
    });

    /**
     * TEST CASE: Duplicate Email Prevention
     *
     * This test ensures the system prevents duplicate user accounts.
     * It's important for data integrity and user experience.
     */
    it("should fail with existing user", async () => {
      // ARRANGE: Set up scenario where email already exists
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });

      // Create existing user data
      const existingUser = {
        id: 1,
        email: validEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository to return existing user
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // ACT: Attempt registration with existing email
      const result = await authService.register(validEmail, validPassword);

      // ASSERT: Verify duplicate prevention
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "A user with this email address already exists"
      );
    });
  });

  /**
   * TOKEN VERIFICATION TESTS
   *
   * Token verification is essential for protecting authenticated routes.
   * These tests ensure that:
   * - Valid tokens are properly decoded and verified
   * - Invalid/expired tokens are rejected
   * - User existence is validated after token verification
   * - Proper error messages are returned for different failure scenarios
   */
  describe("verifyToken", () => {
    /**
     * TEST DATA SETUP:
     *
     * Token verification requires both a valid JWT token and
     * an existing user in the database.
     */
    const validToken = "valid-jwt-token";
    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: "hashedpassword",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * TEST CASE: Successful Token Verification (Happy Path)
     *
     * This test validates the complete token verification flow:
     * 1. JWT token is decoded and verified
     * 2. User ID from token is used to fetch user from database
     * 3. User data is returned (excluding sensitive information)
     */
    it("should verify valid token successfully", async () => {
      // ARRANGE: Set up successful token verification scenario
      // Mock JWT verification to return decoded payload
      MockedAuthUtils.verifyToken.mockReturnValue({
        id: 1,
        email: "test@example.com",
      });

      // Mock repository to return user data
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // ACT: Verify the token
      const result = await authService.verifyToken(validToken);

      // ASSERT: Verify successful verification
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        // Note: password is excluded from response for security
      });
    });

    /**
     * TEST CASE: Invalid/Expired Token
     *
     * This test ensures that invalid or expired tokens are properly rejected.
     * The AuthUtils.verifyToken returns null for invalid tokens.
     */
    it("should fail with invalid token", async () => {
      // ARRANGE: Mock token verification to fail
      MockedAuthUtils.verifyToken.mockReturnValue(null);

      // ACT: Attempt to verify invalid token
      const result = await authService.verifyToken("invalid-token");

      // ASSERT: Verify proper error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired token");
    });

    /**
     * TEST CASE: Valid Token but User Not Found
     *
     * This test handles the edge case where a token is valid but the
     * associated user no longer exists in the database (e.g., user was deleted).
     */
    it("should fail when user not found", async () => {
      // ARRANGE: Set up scenario where token is valid but user doesn't exist
      // Mock successful token verification
      MockedAuthUtils.verifyToken.mockReturnValue({
        id: 1,
        email: "test@example.com",
      });

      // Mock repository to return null (user not found)
      mockUserRepository.findById.mockResolvedValue(null);

      // ACT: Attempt to verify token for non-existent user
      const result = await authService.verifyToken(validToken);

      // ASSERT: Verify proper error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });
});
