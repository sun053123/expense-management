"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const repositories_1 = require("../repositories");
const utils_1 = require("../utils");
const auth_schemas_1 = require("../validation/auth.schemas");
const logger_1 = __importDefault(require("../utils/logger"));
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
class AuthService {
    constructor() {
        this.userRepository = new repositories_1.UserRepository();
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
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info(`Login attempt for email: ${email}`);
                // Step 1: Validate input data using Zod schemas
                const validationResult = this.validateLoginInput(email, password);
                if (!validationResult.success) {
                    return {
                        success: false,
                        error: validationResult.error,
                    };
                }
                // Step 2: Find user by email address
                const user = yield this.findUserByEmail(email);
                if (!user.success) {
                    return {
                        success: false,
                        error: user.error,
                    };
                }
                // Step 3: Verify password securely
                const passwordVerification = yield this.verifyUserPassword(password, user.data.password);
                if (!passwordVerification.success) {
                    return {
                        success: false,
                        error: passwordVerification.error,
                    };
                }
                // Step 4: Generate authentication token and prepare response
                const authPayload = this.createAuthenticationPayload(user.data);
                logger_1.default.info(`User ${email} logged in successfully`);
                return {
                    success: true,
                    data: authPayload,
                };
            }
            catch (error) {
                logger_1.default.error("Unexpected error during login:", error);
                return {
                    success: false,
                    error: "An unexpected error occurred during login. Please try again.",
                };
            }
        });
    }
    /**
     * Validate login input data using Zod schemas
     *
     * @param email - Email to validate
     * @param password - Password to validate
     * @returns Validation result
     */
    validateLoginInput(email, password) {
        const validation = auth_schemas_1.AuthValidation.validateLogin({ email, password });
        if (!validation.success) {
            const errorMessages = auth_schemas_1.AuthValidation.formatValidationErrors(validation.error);
            logger_1.default.warn(`Login validation failed: ${errorMessages.join(", ")}`);
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
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.findByEmail(email);
                if (!user) {
                    // Use generic error message to prevent email enumeration attacks
                    logger_1.default.warn(`Login attempt with non-existent email: ${email}`);
                    return {
                        success: false,
                        error: "Invalid email or password",
                    };
                }
                return {
                    success: true,
                    data: user,
                };
            }
            catch (error) {
                logger_1.default.error(`Error finding user by email ${email}:`, error);
                return {
                    success: false,
                    error: "An error occurred while processing your request",
                };
            }
        });
    }
    /**
     * Verify user password securely
     *
     * @param plainPassword - Plain text password from user input
     * @param hashedPassword - Hashed password from database
     * @returns Service response indicating password validity
     */
    verifyUserPassword(plainPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isPasswordValid = yield utils_1.AuthUtils.comparePassword(plainPassword, hashedPassword);
                if (!isPasswordValid) {
                    logger_1.default.warn("Password verification failed during login");
                    return {
                        success: false,
                        error: "Invalid email or password",
                    };
                }
                return { success: true, data: null };
            }
            catch (error) {
                logger_1.default.error("Error verifying password:", error);
                return {
                    success: false,
                    error: "An error occurred while verifying your credentials",
                };
            }
        });
    }
    /**
     * Create authentication payload with JWT token
     *
     * @param user - User object from database
     * @returns Authentication payload with token and user data
     */
    createAuthenticationPayload(user) {
        // Remove sensitive data from user object
        const userWithoutPassword = this.sanitizeUserData(user);
        // Generate JWT token for the authenticated user
        const token = utils_1.AuthUtils.generateToken(userWithoutPassword);
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
    sanitizeUserData(user) {
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
    register(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info(`Registration attempt for email: ${email}`);
                // Step 1: Validate input data using Zod schemas
                const validationResult = this.validateRegistrationInput(email, password);
                if (!validationResult.success) {
                    return {
                        success: false,
                        error: validationResult.error,
                    };
                }
                // Step 2: Check if user already exists
                const existingUserCheck = yield this.checkUserExists(email);
                if (!existingUserCheck.success) {
                    return {
                        success: false,
                        error: existingUserCheck.error,
                    };
                }
                // Step 3: Hash password securely
                const hashedPassword = yield this.hashUserPassword(password);
                if (!hashedPassword.success) {
                    return {
                        success: false,
                        error: hashedPassword.error,
                    };
                }
                // Step 4: Create user in database
                const newUser = yield this.createNewUser(email, hashedPassword.data);
                if (!newUser.success) {
                    return {
                        success: false,
                        error: newUser.error,
                    };
                }
                // Step 5: Generate authentication token and prepare response
                const authPayload = this.createAuthenticationPayload(newUser.data);
                logger_1.default.info(`User ${email} registered successfully`);
                return {
                    success: true,
                    data: authPayload,
                };
            }
            catch (error) {
                logger_1.default.error("Unexpected error during registration:", error);
                return {
                    success: false,
                    error: "An unexpected error occurred during registration. Please try again.",
                };
            }
        });
    }
    /**
     * Validate registration input data using Zod schemas
     *
     * @param email - Email to validate
     * @param password - Password to validate (with stricter requirements)
     * @returns Validation result
     */
    validateRegistrationInput(email, password) {
        const validation = auth_schemas_1.AuthValidation.validateRegister({ email, password });
        if (!validation.success) {
            const errorMessages = auth_schemas_1.AuthValidation.formatValidationErrors(validation.error);
            logger_1.default.warn(`Registration validation failed: ${errorMessages.join(", ")}`);
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
    checkUserExists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield this.userRepository.findByEmail(email);
                if (existingUser) {
                    logger_1.default.warn(`Registration attempt with existing email: ${email}`);
                    return {
                        success: false,
                        error: "A user with this email address already exists",
                    };
                }
                return { success: true, data: null };
            }
            catch (error) {
                logger_1.default.error(`Error checking user existence for email ${email}:`, error);
                return {
                    success: false,
                    error: "An error occurred while processing your request",
                };
            }
        });
    }
    /**
     * Hash user password securely
     *
     * @param password - Plain text password to hash
     * @returns Service response with hashed password or error
     */
    hashUserPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hashedPassword = yield utils_1.AuthUtils.hashPassword(password);
                return {
                    success: true,
                    data: hashedPassword,
                };
            }
            catch (error) {
                logger_1.default.error("Error hashing password during registration:", error);
                return {
                    success: false,
                    error: "An error occurred while processing your password",
                };
            }
        });
    }
    /**
     * Create a new user in the database
     *
     * @param email - User's email address
     * @param hashedPassword - Securely hashed password
     * @returns Service response with created user or error
     */
    createNewUser(email, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.create({
                    email,
                    password: hashedPassword,
                });
                return {
                    success: true,
                    data: user,
                };
            }
            catch (error) {
                logger_1.default.error("Error creating user during registration:", error);
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
        });
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
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug("Token verification attempt");
                // Step 1: Validate and decode the JWT token
                const tokenValidation = this.validateAndDecodeToken(token);
                if (!tokenValidation.success) {
                    return {
                        success: false,
                        error: tokenValidation.error,
                    };
                }
                // Step 2: Find user in database to ensure they still exist
                const user = yield this.findUserById(tokenValidation.data.id);
                if (!user.success) {
                    return {
                        success: false,
                        error: user.error,
                    };
                }
                // Step 3: Return sanitized user data
                const sanitizedUser = this.sanitizeUserData(user.data);
                logger_1.default.debug(`Token verified successfully for user ID: ${sanitizedUser.id}`);
                return {
                    success: true,
                    data: sanitizedUser,
                };
            }
            catch (error) {
                logger_1.default.error("Unexpected error during token verification:", error);
                return {
                    success: false,
                    error: "Token verification failed",
                };
            }
        });
    }
    /**
     * Validate and decode JWT token
     *
     * @param token - JWT token to validate
     * @returns Service response with decoded token data or error
     */
    validateAndDecodeToken(token) {
        try {
            // Use AuthUtils to verify the token
            const decoded = utils_1.AuthUtils.verifyToken(token);
            if (!decoded) {
                logger_1.default.debug("Token verification failed - invalid or expired");
                return {
                    success: false,
                    error: "Invalid or expired token",
                };
            }
            return {
                success: true,
                data: decoded,
            };
        }
        catch (error) {
            logger_1.default.error("Error decoding token:", error);
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
    findUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.findById(userId);
                if (!user) {
                    logger_1.default.warn(`Token verification failed - user not found: ${userId}`);
                    return {
                        success: false,
                        error: "User not found",
                    };
                }
                return {
                    success: true,
                    data: user,
                };
            }
            catch (error) {
                logger_1.default.error(`Error finding user by ID ${userId}:`, error);
                return {
                    success: false,
                    error: "An error occurred while verifying your token",
                };
            }
        });
    }
}
exports.AuthService = AuthService;
