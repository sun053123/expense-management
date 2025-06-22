import { IAuthService, ServiceResponse, AuthPayload, User } from "../types";
import { UserRepository } from "../repositories";
import { AuthUtils } from "../utils";
import { AuthValidation } from "../validation/auth.schemas";
import logger from "../utils/logger";

/**
 * AuthService - Core authentication business logic
 *
 * This service handles all authentication-related operations including:
 * - User login with email and password validation
 * - User registration with comprehensive input validation
 * - JWT token verification and user authentication
 * - Secure password handling and user data management
 *
 * The service is designed with security best practices, comprehensive error handling,
 * and clear separation of concerns. Each method is broken down into smaller,
 * well-documented functions for better readability and maintainability.
 */
export class AuthService implements IAuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**.
   * Authenticate a user with email and password
   *
   * This method handles the complete login flow:
   * 1. Validates input data using Zod schemas
   * 2. Finds the user in the database
   * 3. Verifies the password securely
   * 4. Generates a JWT token for the authenticated user
   *
   * @param email - User's email address
   * @param password - User's plain text password
   * @returns Service response with authentication payload or error
   */
  async login(
    email: string,
    password: string
  ): Promise<ServiceResponse<AuthPayload>> {
    try {
      logger.info(`Login attempt for email: ${email}`);

      // Step 1: Validate input data using Zod schemas
      const validationResult = this.validateLoginInput(email, password);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Step 2: Find user by email address
      const user = await this.findUserByEmail(email);
      if (!user.success) {
        return {
          success: false,
          error: user.error,
        };
      }

      // Step 3: Verify password securely
      const passwordVerification = await this.verifyUserPassword(
        password,
        user.data!.password
      );
      if (!passwordVerification.success) {
        return {
          success: false,
          error: passwordVerification.error,
        };
      }

      // Step 4: Generate authentication token and prepare response
      const authPayload = this.createAuthenticationPayload(user.data!);

      logger.info(`User ${email} logged in successfully`);
      return {
        success: true,
        data: authPayload,
      };
    } catch (error) {
      logger.error("Unexpected error during login:", error);
      return {
        success: false,
        error: "An unexpected error occurred during login. Please try again.",
      };
    }
  }

  /**
   * Validate login input data using Zod schemas
   *
   * @param email - Email to validate
   * @param password - Password to validate
   * @returns Validation result
   */
  private validateLoginInput(
    email: string,
    password: string
  ): ServiceResponse<null> {
    const validation = AuthValidation.validateLogin({ email, password });

    if (!validation.success) {
      const errorMessages = AuthValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(`Login validation failed: ${errorMessages.join(", ")}`);

      return {
        success: false,
        error: errorMessages[0] || "Invalid input data",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Find user by email address with security considerations
   *
   * @param email - Email address to search for
   * @returns Service response with user data or error
   */
  private async findUserByEmail(email: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        // Use generic error message to prevent email enumeration attacks
        logger.warn(`Login attempt with non-existent email: ${email}`);
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      return {
        success: false,
        error: "An error occurred while processing your request",
      };
    }
  }

  /**
   * Verify user password securely
   *
   * @param plainPassword - Plain text password from user input
   * @param hashedPassword - Hashed password from database
   * @returns Service response indicating password validity
   */
  private async verifyUserPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<ServiceResponse<null>> {
    try {
      const isPasswordValid = await AuthUtils.comparePassword(
        plainPassword,
        hashedPassword
      );

      if (!isPasswordValid) {
        logger.warn("Password verification failed during login");
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      return { success: true, data: null };
    } catch (error) {
      logger.error("Error verifying password:", error);
      return {
        success: false,
        error: "An error occurred while verifying your credentials",
      };
    }
  }

  /**
   * Create authentication payload with JWT token
   *
   * @param user - User object from database
   * @returns Authentication payload with token and user data
   */
  private createAuthenticationPayload(user: User): AuthPayload {
    // Remove sensitive data from user object
    const userWithoutPassword = this.sanitizeUserData(user);

    // Generate JWT token for the authenticated user
    const token = AuthUtils.generateToken(userWithoutPassword);

    return {
      token,
      user: userWithoutPassword,
    };
  }

  /**
   * Remove sensitive data from user object
   *
   * @param user - User object with potentially sensitive data
   * @returns User object without sensitive fields
   */
  private sanitizeUserData(user: User): Omit<User, "password"> {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Register a new user with email and password
   *
   * This method handles the complete registration flow:
   * 1. Validates input data using Zod schemas with stricter password requirements
   * 2. Checks if user already exists to prevent duplicates
   * 3. Hashes the password securely
   * 4. Creates the user in the database
   * 5. Generates a JWT token for the new user
   *
   * @param email - User's email address
   * @param password - User's plain text password
   * @returns Service response with authentication payload or error
   */
  async register(
    email: string,
    password: string
  ): Promise<ServiceResponse<AuthPayload>> {
    try {
      logger.info(`Registration attempt for email: ${email}`);

      // Step 1: Validate input data using Zod schemas
      const validationResult = this.validateRegistrationInput(email, password);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Step 2: Check if user already exists
      const existingUserCheck = await this.checkUserExists(email);
      if (!existingUserCheck.success) {
        return {
          success: false,
          error: existingUserCheck.error,
        };
      }

      // Step 3: Hash password securely
      const hashedPassword = await this.hashUserPassword(password);
      if (!hashedPassword.success) {
        return {
          success: false,
          error: hashedPassword.error,
        };
      }

      // Step 4: Create user in database
      const newUser = await this.createNewUser(email, hashedPassword.data!);
      if (!newUser.success) {
        return {
          success: false,
          error: newUser.error,
        };
      }

      // Step 5: Generate authentication token and prepare response
      const authPayload = this.createAuthenticationPayload(newUser.data!);

      logger.info(`User ${email} registered successfully`);
      return {
        success: true,
        data: authPayload,
      };
    } catch (error) {
      logger.error("Unexpected error during registration:", error);
      return {
        success: false,
        error:
          "An unexpected error occurred during registration. Please try again.",
      };
    }
  }

  /**
   * Validate registration input data using Zod schemas
   *
   * @param email - Email to validate
   * @param password - Password to validate (with stricter requirements)
   * @returns Validation result
   */
  private validateRegistrationInput(
    email: string,
    password: string
  ): ServiceResponse<null> {
    const validation = AuthValidation.validateRegister({ email, password });

    if (!validation.success) {
      const errorMessages = AuthValidation.formatValidationErrors(
        validation.error
      );
      logger.warn(
        `Registration validation failed: ${errorMessages.join(", ")}`
      );

      return {
        success: false,
        error: errorMessages[0] || "Invalid input data",
      };
    }

    return { success: true, data: null };
  }

  /**
   * Check if a user already exists with the given email
   *
   * @param email - Email address to check
   * @returns Service response indicating if user exists
   */
  private async checkUserExists(email: string): Promise<ServiceResponse<null>> {
    try {
      const existingUser = await this.userRepository.findByEmail(email);

      if (existingUser) {
        logger.warn(`Registration attempt with existing email: ${email}`);
        return {
          success: false,
          error: "A user with this email address already exists",
        };
      }

      return { success: true, data: null };
    } catch (error) {
      logger.error(`Error checking user existence for email ${email}:`, error);
      return {
        success: false,
        error: "An error occurred while processing your request",
      };
    }
  }

  /**
   * Hash user password securely
   *
   * @param password - Plain text password to hash
   * @returns Service response with hashed password or error
   */
  private async hashUserPassword(
    password: string
  ): Promise<ServiceResponse<string>> {
    try {
      const hashedPassword = await AuthUtils.hashPassword(password);
      return {
        success: true,
        data: hashedPassword,
      };
    } catch (error) {
      logger.error("Error hashing password during registration:", error);
      return {
        success: false,
        error: "An error occurred while processing your password",
      };
    }
  }

  /**
   * Create a new user in the database
   *
   * @param email - User's email address
   * @param hashedPassword - Securely hashed password
   * @returns Service response with created user or error
   */
  private async createNewUser(
    email: string,
    hashedPassword: string
  ): Promise<ServiceResponse<User>> {
    try {
      const user = await this.userRepository.create({
        email,
        password: hashedPassword,
      });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error("Error creating user during registration:", error);

      // Handle specific database errors
      if (error instanceof Error && error.message.includes("already exists")) {
        return {
          success: false,
          error: "A user with this email address already exists",
        };
      }

      return {
        success: false,
        error: "An error occurred while creating your account",
      };
    }
  }

  /**
   * Verify a JWT token and return user information
   *
   * This method handles token verification:
   * 1. Validates the token format and signature
   * 2. Extracts user information from the token
   * 3. Verifies the user still exists in the database
   * 4. Returns sanitized user data
   *
   * @param token - JWT token to verify
   * @returns Service response with user data or error
   */
  async verifyToken(
    token: string
  ): Promise<ServiceResponse<Omit<User, "password">>> {
    try {
      logger.debug("Token verification attempt");

      // Step 1: Validate and decode the JWT token
      const tokenValidation = this.validateAndDecodeToken(token);
      if (!tokenValidation.success) {
        return {
          success: false,
          error: tokenValidation.error,
        };
      }

      // Step 2: Find user in database to ensure they still exist
      const user = await this.findUserById(tokenValidation.data!.id);
      if (!user.success) {
        return {
          success: false,
          error: user.error,
        };
      }

      // Step 3: Return sanitized user data
      const sanitizedUser = this.sanitizeUserData(user.data!);

      logger.debug(
        `Token verified successfully for user ID: ${sanitizedUser.id}`
      );
      return {
        success: true,
        data: sanitizedUser,
      };
    } catch (error) {
      logger.error("Unexpected error during token verification:", error);
      return {
        success: false,
        error: "Token verification failed",
      };
    }
  }

  /**
   * Validate and decode JWT token
   *
   * @param token - JWT token to validate
   * @returns Service response with decoded token data or error
   */
  private validateAndDecodeToken(
    token: string
  ): ServiceResponse<{ id: number; email: string }> {
    try {
      // Use AuthUtils to verify the token
      const decoded = AuthUtils.verifyToken(token);

      if (!decoded) {
        logger.debug("Token verification failed - invalid or expired");
        return {
          success: false,
          error: "Invalid or expired token",
        };
      }

      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      logger.error("Error decoding token:", error);
      return {
        success: false,
        error: "Token verification failed",
      };
    }
  }

  /**
   * Find user by ID for token verification
   *
   * @param userId - User ID from token
   * @returns Service response with user data or error
   */
  private async findUserById(userId: number): Promise<ServiceResponse<User>> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        logger.warn(`Token verification failed - user not found: ${userId}`);
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error(`Error finding user by ID ${userId}:`, error);
      return {
        success: false,
        error: "An error occurred while verifying your token",
      };
    }
  }
}
