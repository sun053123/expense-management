/**
 * AuthUtils Test Suite
 *
 * This test suite validates the authentication utility functions that handle
 * critical security operations including password hashing, JWT token management,
 * and input validation. These utilities are the foundation of the application's
 * security infrastructure.
 *
 * TESTING STRATEGY:
 * - Mock external cryptographic libraries to control behavior and improve speed
 * - Test both success and failure scenarios for each utility function
 * - Validate security-related edge cases and error conditions
 * - Ensure consistent behavior across different input types
 *
 * LEARNING OBJECTIVES FOR JUNIOR DEVELOPERS:
 * - Understanding utility function testing patterns
 * - Learning why and how to mock cryptographic operations
 * - Grasping security testing best practices
 * - Recognizing the importance of input validation testing
 * - Understanding JWT token lifecycle testing
 */

import { AuthUtils } from "../../utils/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * MOCKING STRATEGY FOR SECURITY LIBRARIES:
 *
 * We mock external security libraries for several important reasons:
 *
 * 1. PERFORMANCE: Cryptographic operations are computationally expensive
 *    - bcrypt hashing can take 100-500ms per operation
 *    - Running hundreds of tests would be very slow without mocking
 *
 * 2. DETERMINISM: Cryptographic functions often include randomness
 *    - bcrypt generates random salts, making output unpredictable
 *    - JWT tokens include timestamps, making them time-dependent
 *    - Mocking ensures consistent, predictable test results
 *
 * 3. ISOLATION: We want to test our logic, not the library's implementation
 *    - We trust that bcrypt and jsonwebtoken work correctly
 *    - We need to test how our code handles their responses
 *
 * 4. ERROR SIMULATION: Mocking allows us to simulate library failures
 *    - Test how our code handles bcrypt errors
 *    - Test how our code handles JWT verification failures
 */
jest.mock("jsonwebtoken");
jest.mock("bcryptjs");

// Type-safe mock declarations for better IDE support
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

/**
 * Main test suite for AuthUtils
 *
 * This describe block groups all AuthUtils tests and provides shared setup
 * that runs before each individual test case.
 */
describe("AuthUtils", () => {
  /**
   * TEST SETUP (beforeEach):
   *
   * Clear all mock call history and return values before each test.
   * This ensures test isolation and prevents test interdependence.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * PASSWORD HASHING TESTS
   *
   * Password hashing is a critical security operation that converts plain text
   * passwords into irreversible hashes. These tests ensure our hashing utility
   * works correctly and uses appropriate security parameters.
   *
   * SECURITY CONSIDERATIONS:
   * - Uses bcrypt with salt rounds of 12 (industry standard for security)
   * - Hashing is irreversible (one-way function)
   * - Each hash includes a unique salt to prevent rainbow table attacks
   */
  describe("hashPassword", () => {
    /**
     * TEST CASE: Successful Password Hashing (Happy Path)
     *
     * This test validates that our utility correctly calls bcrypt with
     * the appropriate parameters and returns the hashed result.
     *
     * WHY WE MOCK BCRYPT:
     * - Real bcrypt hashing takes 100-500ms (too slow for unit tests)
     * - Real bcrypt output is unpredictable due to random salts
     * - We trust bcrypt works; we're testing our wrapper function
     */
    it("should hash a password successfully", async () => {
      // ARRANGE: Set up test data and mock behavior
      const password = "testpassword";
      const hashedPassword = "hashedpassword";

      // Mock bcrypt.hash to return our test hash
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // ACT: Call our utility function
      const result = await AuthUtils.hashPassword(password);

      // ASSERT: Verify correct bcrypt usage and result
      // Verify bcrypt was called with correct parameters
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      // 12 is the salt rounds - higher = more secure but slower

      // Verify our function returns the bcrypt result
      expect(result).toBe(hashedPassword);
    });
  });

  /**
   * PASSWORD COMPARISON TESTS
   *
   * Password comparison is used during login to verify that a plain text
   * password matches a stored hash. This is a critical security operation
   * that must be both secure and reliable.
   *
   * HOW BCRYPT COMPARISON WORKS:
   * - bcrypt.compare() extracts the salt from the stored hash
   * - It hashes the plain text password with the same salt
   * - It compares the two hashes in constant time (prevents timing attacks)
   */
  describe("comparePassword", () => {
    /**
     * TEST CASE: Matching Passwords (Happy Path)
     *
     * This test validates that our utility correctly identifies when
     * a plain text password matches its stored hash.
     */
    it("should return true for matching passwords", async () => {
      // ARRANGE: Set up test data
      const password = "testpassword";
      const hashedPassword = "hashedpassword";

      // Mock bcrypt.compare to return true (passwords match)
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // ACT: Compare the passwords
      const result = await AuthUtils.comparePassword(password, hashedPassword);

      // ASSERT: Verify correct bcrypt usage and result
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    /**
     * TEST CASE: Non-Matching Passwords
     *
     * This test validates that our utility correctly identifies when
     * a plain text password does NOT match its stored hash.
     * This is equally important for security.
     */
    it("should return false for non-matching passwords", async () => {
      // ARRANGE: Set up test data
      const password = "testpassword";
      const hashedPassword = "hashedpassword";

      // Mock bcrypt.compare to return false (passwords don't match)
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // ACT: Compare the passwords
      const result = await AuthUtils.comparePassword(password, hashedPassword);

      // ASSERT: Verify the result is false
      expect(result).toBe(false);
      // Note: We don't need to verify bcrypt.compare call again
      // as it's the same function being tested
    });
  });

  /**
   * JWT TOKEN GENERATION TESTS
   *
   * JWT (JSON Web Token) generation creates signed tokens that contain user
   * information and can be verified later. These tokens are used for stateless
   * authentication in our API.
   *
   * JWT STRUCTURE:
   * - Header: Contains algorithm and token type
   * - Payload: Contains user data and metadata (claims)
   * - Signature: Ensures token hasn't been tampered with
   *
   * SECURITY CONSIDERATIONS:
   * - Tokens are signed with a secret key
   * - Tokens have expiration times to limit exposure
   * - Issuer and audience claims prevent token misuse
   */
  describe("generateToken", () => {
    /**
     * TEST CASE: JWT Token Generation (Happy Path)
     *
     * This test validates that our utility correctly creates JWT tokens
     * with the appropriate payload, security settings, and metadata.
     *
     * WHY WE MOCK JWT.SIGN:
     * - Real JWT tokens are time-dependent (include timestamps)
     * - Real JWT tokens are long and complex (hard to test)
     * - We trust jsonwebtoken library works; we're testing our wrapper
     */
    it("should generate a JWT token", () => {
      // ARRANGE: Set up user data and expected token
      const user = {
        id: 1,
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = "generated-token";

      // Mock jwt.sign to return our test token
      mockedJwt.sign.mockReturnValue(token as never);

      // ACT: Generate the token
      const result = AuthUtils.generateToken(user);

      // ASSERT: Verify correct JWT configuration
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        // Payload: What data goes into the token
        expect.objectContaining({
          id: user.id,
          email: user.email,
          iat: expect.any(Number), // "issued at" timestamp
        }),
        // Secret: Used to sign the token
        process.env.JWT_SECRET,
        // Options: Security and metadata settings
        expect.objectContaining({
          expiresIn: process.env.JWT_EXPIRES_IN || "7d", // Token lifetime
          issuer: "expense-management-api", // Who issued the token
          audience: "expense-management-client", // Who can use the token
        })
      );

      // Verify our function returns the JWT result
      expect(result).toBe(token);
    });
  });

  /**
   * JWT TOKEN VERIFICATION TESTS
   *
   * Token verification is used to validate incoming JWT tokens and extract
   * user information from them. This is critical for protecting authenticated
   * routes and ensuring only valid users can access protected resources.
   *
   * VERIFICATION PROCESS:
   * - Check token signature using the secret key
   * - Validate expiration time
   * - Verify issuer and audience claims
   * - Extract and return payload data
   */
  describe("verifyToken", () => {
    /**
     * TEST CASE: Valid Token Verification (Happy Path)
     *
     * This test validates that our utility correctly verifies valid JWT tokens
     * and extracts the user information from the payload.
     */
    it("should verify a valid token", () => {
      // ARRANGE: Set up valid token and expected decoded data
      const token = "valid-token";
      const decoded = { id: 1, email: "test@example.com" };

      // Mock jwt.verify to return decoded payload
      mockedJwt.verify.mockReturnValue(decoded as never);

      // ACT: Verify the token
      const result = AuthUtils.verifyToken(token);

      // ASSERT: Verify correct JWT verification
      expect(mockedJwt.verify).toHaveBeenCalledWith(
        token, // The token to verify
        process.env.JWT_SECRET, // Secret used to verify signature
        // Verification options
        expect.objectContaining({
          issuer: "expense-management-api", // Expected issuer
          audience: "expense-management-client", // Expected audience
        })
      );

      // Verify our function returns the decoded payload
      expect(result).toEqual(decoded);
    });

    /**
     * TEST CASE: Invalid Token Handling
     *
     * This test validates that our utility properly handles invalid tokens
     * by catching JWT verification errors and returning null instead of
     * throwing exceptions that could crash the application.
     */
    it("should return null for invalid token", () => {
      // ARRANGE: Set up invalid token
      const token = "invalid-token";

      // Mock jwt.verify to throw an error (invalid token)
      mockedJwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // ACT: Attempt to verify invalid token
      const result = AuthUtils.verifyToken(token);

      // ASSERT: Verify graceful error handling
      expect(result).toBeNull();
      // Our utility should catch the error and return null
      // This prevents authentication errors from crashing the app
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer header", () => {
      // Use a valid JWT format token (header.payload.signature)
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const authHeader = `Bearer ${validToken}`;
      const result = AuthUtils.extractTokenFromHeader(authHeader);
      expect(result).toBe(validToken);
    });

    it("should return null for invalid header format", () => {
      const authHeader = "Invalid header";
      const result = AuthUtils.extractTokenFromHeader(authHeader);
      expect(result).toBeNull();
    });

    it("should return null for undefined header", () => {
      const result = AuthUtils.extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      expect(AuthUtils.isValidEmail("test@example.com")).toBe(true);
      expect(AuthUtils.isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("should return false for invalid email", () => {
      expect(AuthUtils.isValidEmail("invalid-email")).toBe(false);
      expect(AuthUtils.isValidEmail("test@")).toBe(false);
      expect(AuthUtils.isValidEmail("@example.com")).toBe(false);
      expect(AuthUtils.isValidEmail("")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("should return valid for good password", () => {
      // Use password that meets registration requirements: 8+ chars, uppercase, lowercase, number
      const result = AuthUtils.isValidPassword("GoodPass123");
      expect(result.valid).toBe(true);
    });

    it("should return invalid for short password", () => {
      const result = AuthUtils.isValidPassword("short");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("at least 8 characters");
    });

    it("should return invalid for password without requirements", () => {
      const result = AuthUtils.isValidPassword("goodpassword"); // no uppercase or number
      expect(result.valid).toBe(false);
      expect(result.message).toContain(
        "at least one lowercase letter, one uppercase letter, and one number"
      );
    });

    it("should return invalid for too long password", () => {
      const longPassword = "a".repeat(129);
      const result = AuthUtils.isValidPassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("less than 128 characters");
    });
  });
});
