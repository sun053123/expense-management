"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.UserRepository = void 0;
const postgres_1 = __importStar(require("../database/postgres"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * UserRepository - Database operations for user management
 *
 * This repository handles all user-related database operations using raw PostgreSQL queries.
 * It provides a clean interface for user CRUD operations with proper error handling,
 * SQL injection protection, and comprehensive logging.
 *
 * Key Features:
 * - Raw SQL queries with parameterized statements for security
 * - Comprehensive error handling and logging
 * - Type-safe operations with TypeScript
 * - Optimized queries for performance
 */
class UserRepository {
    /**
     * Find a user by their unique ID
     *
     * @param id - The user's unique identifier
     * @returns User object if found, null otherwise
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Finding user by ID: ${id}`);
                const query = `
        SELECT id, email, password, created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE id = $1
      `;
                const user = yield postgres_1.default.queryOne(query, [id]);
                if (user) {
                    logger_1.default.debug(`User found with ID: ${id}`);
                }
                else {
                    logger_1.default.debug(`No user found with ID: ${id}`);
                }
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error finding user by ID ${id}:`, error);
                throw new Error("Failed to find user by ID");
            }
        });
    }
    /**
     * Find a user by their email address
     *
     * @param email - The user's email address
     * @returns User object if found, null otherwise
     */
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Finding user by email: ${email}`);
                const query = `
        SELECT id, email, password, created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE email = $1
      `;
                const user = yield postgres_1.default.queryOne(query, [email.toLowerCase()]);
                if (user) {
                    logger_1.default.debug(`User found with email: ${email}`);
                }
                else {
                    logger_1.default.debug(`No user found with email: ${email}`);
                }
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error finding user by email ${email}:`, error);
                throw new Error("Failed to find user by email");
            }
        });
    }
    /**
     * Create a new user in the database
     *
     * @param userData - User data without ID and timestamps
     * @returns Newly created user object
     */
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Creating new user with email: ${userData.email}`);
                const query = `
        INSERT INTO users (email, password, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, email, password, created_at as "createdAt", updated_at as "updatedAt"
      `;
                const user = yield postgres_1.default.queryOne(query, [
                    userData.email.toLowerCase(),
                    userData.password,
                ]);
                if (!user) {
                    throw new Error("Failed to create user - no data returned");
                }
                logger_1.default.info(`User created successfully with ID: ${user.id} and email: ${user.email}`);
                return user;
            }
            catch (error) {
                logger_1.default.error("Error creating user:", error);
                // Handle unique constraint violation (duplicate email)
                if (error instanceof Error &&
                    error.message.includes("duplicate key value")) {
                    throw new Error("User with this email already exists");
                }
                throw new Error("Failed to create user");
            }
        });
    }
    /**
     * Update an existing user's information
     *
     * @param id - The user's unique identifier
     * @param userData - Partial user data to update
     * @returns Updated user object if found, null otherwise
     */
    update(id, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Updating user with ID: ${id}`);
                // Build dynamic update query based on provided fields
                const updates = {};
                if (userData.email !== undefined) {
                    updates.email = userData.email.toLowerCase();
                }
                if (userData.password !== undefined) {
                    updates.password = userData.password;
                }
                // Always update the updated_at timestamp
                updates.updated_at = "NOW()";
                if (Object.keys(updates).length === 1) {
                    // Only updated_at would be updated, so no actual changes
                    logger_1.default.debug(`No fields to update for user ID: ${id}`);
                    return yield this.findById(id);
                }
                const { clause, params } = postgres_1.DatabaseHelpers.buildUpdateClause(updates);
                params.push(id); // Add ID parameter for WHERE clause
                const query = `
        UPDATE users
        ${clause}
        WHERE id = $${params.length}
        RETURNING id, email, password, created_at as "createdAt", updated_at as "updatedAt"
      `;
                const user = yield postgres_1.default.queryOne(query, params);
                if (user) {
                    logger_1.default.info(`User updated successfully with ID: ${id}`);
                }
                else {
                    logger_1.default.debug(`No user found to update with ID: ${id}`);
                }
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error updating user ${id}:`, error);
                // Handle unique constraint violation (duplicate email)
                if (error instanceof Error &&
                    error.message.includes("duplicate key value")) {
                    throw new Error("Email address is already in use");
                }
                throw new Error("Failed to update user");
            }
        });
    }
    /**
     * Delete a user from the database
     *
     * @param id - The user's unique identifier
     * @returns true if user was deleted, false if user not found
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Deleting user with ID: ${id}`);
                const query = `
        DELETE FROM users
        WHERE id = $1
      `;
                const result = yield postgres_1.default.query(query, [id]);
                const deleted = result.rowCount !== null && result.rowCount > 0;
                if (deleted) {
                    logger_1.default.info(`User deleted successfully with ID: ${id}`);
                }
                else {
                    logger_1.default.debug(`No user found to delete with ID: ${id}`);
                }
                return deleted;
            }
            catch (error) {
                logger_1.default.error(`Error deleting user ${id}:`, error);
                throw new Error("Failed to delete user");
            }
        });
    }
    /**
     * Check if a user exists by email (lightweight check)
     *
     * @param email - The user's email address
     * @returns true if user exists, false otherwise
     */
    existsByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug(`Checking if user exists with email: ${email}`);
                const query = `
        SELECT 1 FROM users WHERE email = $1 LIMIT 1
      `;
                const result = yield postgres_1.default.queryOne(query, [email.toLowerCase()]);
                return result !== null;
            }
            catch (error) {
                logger_1.default.error(`Error checking user existence by email ${email}:`, error);
                throw new Error("Failed to check user existence");
            }
        });
    }
    /**
     * Get total count of users (for admin purposes)
     *
     * @returns Total number of users in the database
     */
    getTotalCount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug("Getting total user count");
                const query = `SELECT COUNT(*) as count FROM users`;
                const result = yield postgres_1.default.queryOne(query);
                return parseInt((result === null || result === void 0 ? void 0 : result.count) || "0", 10);
            }
            catch (error) {
                logger_1.default.error("Error getting total user count:", error);
                throw new Error("Failed to get user count");
            }
        });
    }
}
exports.UserRepository = UserRepository;
