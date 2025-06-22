import { User, IUserRepository } from "../types";
import database, { DatabaseHelpers } from "../database/postgres";
import logger from "../utils/logger";

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
export class UserRepository implements IUserRepository {
  /**
   * Find a user by their unique ID
   *
   * @param id - The user's unique identifier
   * @returns User object if found, null otherwise
   */
  async findById(id: number): Promise<User | null> {
    try {
      logger.debug(`Finding user by ID: ${id}`);

      const query = `
        SELECT id, email, password, created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE id = $1
      `;

      const user = await database.queryOne<User>(query, [id]);

      if (user) {
        logger.debug(`User found with ID: ${id}`);
      } else {
        logger.debug(`No user found with ID: ${id}`);
      }

      return user;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw new Error("Failed to find user by ID");
    }
  }

  /**
   * Find a user by their email address
   *
   * @param email - The user's email address
   * @returns User object if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      logger.debug(`Finding user by email: ${email}`);

      const query = `
        SELECT id, email, password, created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE email = $1
      `;

      const user = await database.queryOne<User>(query, [email.toLowerCase()]);

      if (user) {
        logger.debug(`User found with email: ${email}`);
      } else {
        logger.debug(`No user found with email: ${email}`);
      }

      return user;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw new Error("Failed to find user by email");
    }
  }

  /**
   * Create a new user in the database
   *
   * @param userData - User data without ID and timestamps
   * @returns Newly created user object
   */
  async create(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    try {
      logger.debug(`Creating new user with email: ${userData.email}`);

      const query = `
        INSERT INTO users (email, password, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, email, password, created_at as "createdAt", updated_at as "updatedAt"
      `;

      const user = await database.queryOne<User>(query, [
        userData.email.toLowerCase(),
        userData.password,
      ]);

      if (!user) {
        throw new Error("Failed to create user - no data returned");
      }

      logger.info(
        `User created successfully with ID: ${user.id} and email: ${user.email}`
      );
      return user;
    } catch (error) {
      logger.error("Error creating user:", error);

      // Handle unique constraint violation (duplicate email)
      if (
        error instanceof Error &&
        error.message.includes("duplicate key value")
      ) {
        throw new Error("User with this email already exists");
      }

      throw new Error("Failed to create user");
    }
  }

  /**
   * Update an existing user's information
   *
   * @param id - The user's unique identifier
   * @param userData - Partial user data to update
   * @returns Updated user object if found, null otherwise
   */
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    try {
      logger.debug(`Updating user with ID: ${id}`);

      // Build dynamic update query based on provided fields
      const updates: Record<string, any> = {};

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
        logger.debug(`No fields to update for user ID: ${id}`);
        return await this.findById(id);
      }

      const { clause, params } = DatabaseHelpers.buildUpdateClause(updates);
      params.push(id); // Add ID parameter for WHERE clause

      const query = `
        UPDATE users
        ${clause}
        WHERE id = $${params.length}
        RETURNING id, email, password, created_at as "createdAt", updated_at as "updatedAt"
      `;

      const user = await database.queryOne<User>(query, params);

      if (user) {
        logger.info(`User updated successfully with ID: ${id}`);
      } else {
        logger.debug(`No user found to update with ID: ${id}`);
      }

      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);

      // Handle unique constraint violation (duplicate email)
      if (
        error instanceof Error &&
        error.message.includes("duplicate key value")
      ) {
        throw new Error("Email address is already in use");
      }

      throw new Error("Failed to update user");
    }
  }

  /**
   * Delete a user from the database
   *
   * @param id - The user's unique identifier
   * @returns true if user was deleted, false if user not found
   */
  async delete(id: number): Promise<boolean> {
    try {
      logger.debug(`Deleting user with ID: ${id}`);

      const query = `
        DELETE FROM users
        WHERE id = $1
      `;

      const result = await database.query(query, [id]);

      const deleted = result.rowCount !== null && result.rowCount > 0;

      if (deleted) {
        logger.info(`User deleted successfully with ID: ${id}`);
      } else {
        logger.debug(`No user found to delete with ID: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Check if a user exists by email (lightweight check)
   *
   * @param email - The user's email address
   * @returns true if user exists, false otherwise
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      logger.debug(`Checking if user exists with email: ${email}`);

      const query = `
        SELECT 1 FROM users WHERE email = $1 LIMIT 1
      `;

      const result = await database.queryOne(query, [email.toLowerCase()]);
      return result !== null;
    } catch (error) {
      logger.error(`Error checking user existence by email ${email}:`, error);
      throw new Error("Failed to check user existence");
    }
  }

  /**
   * Get total count of users (for admin purposes)
   *
   * @returns Total number of users in the database
   */
  async getTotalCount(): Promise<number> {
    try {
      logger.debug("Getting total user count");

      const query = `SELECT COUNT(*) as count FROM users`;
      const result = await database.queryOne<{ count: string }>(query);

      return parseInt(result?.count || "0", 10);
    } catch (error) {
      logger.error("Error getting total user count:", error);
      throw new Error("Failed to get user count");
    }
  }
}
