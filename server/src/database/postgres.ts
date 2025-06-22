import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { config } from "../config";
import logger from "../utils/logger";

/**
 * PostgreSQL Database Helper Utilities
 *
 * This module provides a clean, secure interface for database operations
 * using raw PostgreSQL queries with connection pooling and proper error handling.
 *
 * Key Features:
 * - Connection pooling for optimal performance
 * - Parameterized queries to prevent SQL injection
 * - Comprehensive error handling and logging
 * - Transaction support for complex operations
 * - Health monitoring and connection management
 */

class PostgreSQLDatabase {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    // Initialize connection pool with optimized settings
    this.pool = new Pool({
      connectionString: config.database.url,
      // Connection pool configuration for optimal performance
      max: 20, // Maximum number of connections in pool
      min: 2, // Minimum number of connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Timeout when connecting to database
      maxUses: 7500, // Close connection after 7500 queries
      allowExitOnIdle: true, // Allow process to exit when all connections are idle
    });

    // Set up connection pool event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for connection pool monitoring
   */
  private setupEventHandlers(): void {
    this.pool.on("connect", (client) => {
      logger.info("New database connection established");
    });

    this.pool.on("acquire", (client) => {
      logger.debug("Connection acquired from pool");
    });

    this.pool.on("error", (err, client) => {
      logger.error("Database pool error:", err);
    });

    this.pool.on("remove", (client) => {
      logger.debug("Connection removed from pool");
    });
  }

  /**
   * Initialize database connection and verify connectivity
   */
  async connect(): Promise<void> {
    try {
      // Test connection with a simple query
      await this.query("SELECT 1 as test");
      this.isConnected = true;
      logger.info("✅ PostgreSQL database connected successfully");
    } catch (error) {
      this.isConnected = false;
      logger.error("❌ Failed to connect to PostgreSQL database:", error);
      throw new Error("Database connection failed");
    }
  }

  /**
   * Close all database connections
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info("✅ Database connections closed successfully");
    } catch (error) {
      logger.error("❌ Error closing database connections:", error);
      throw error;
    }
  }

  /**
   * Execute a parameterized query with automatic error handling
   *
   * @param text - SQL query string with parameter placeholders ($1, $2, etc.)
   * @param params - Array of parameter values
   * @returns Query result
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      // Log query performance in development
      if (config.nodeEnv === "development") {
        logger.debug(`Query executed in ${duration}ms:`, {
          query: text,
          params: params ? "[REDACTED]" : undefined,
          rowCount: result.rowCount,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Query failed after ${duration}ms:`, {
        query: text,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Execute a query and return the first row or null
   * Useful for queries that should return a single record
   */
  async queryOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query and return all rows
   * Useful for queries that return multiple records
   */
  async queryMany<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Execute multiple queries within a transaction
   * Automatically handles commit/rollback based on success/failure
   *
   * @param callback - Function that receives a client and executes queries
   * @returns Result of the callback function
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");

      logger.debug("Transaction completed successfully");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction rolled back due to error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database health and connectivity
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const start = Date.now();
      const result = await this.query(
        "SELECT NOW() as current_time, version() as version"
      );
      const responseTime = Date.now() - start;

      return {
        healthy: true,
        details: {
          connected: this.isConnected,
          responseTime: `${responseTime}ms`,
          currentTime: result.rows[0]?.current_time,
          version: result.rows[0]?.version,
          poolStats: {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
          },
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const database = new PostgreSQLDatabase();

// Export singleton instance and types
export default database;
export { PostgreSQLDatabase };
export type { QueryResult, PoolClient, QueryResultRow } from "pg";

/**
 * Helper functions for common database operations
 */
export class DatabaseHelpers {
  /**
   * Build a WHERE clause with parameterized conditions
   * Helps prevent SQL injection while building dynamic queries
   */
  static buildWhereClause(
    conditions: Record<string, any>,
    startParamIndex: number = 1
  ): { clause: string; params: any[]; nextParamIndex: number } {
    const params: any[] = [];
    const clauses: string[] = [];
    let paramIndex = startParamIndex;

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
      nextParamIndex: paramIndex,
    };
  }

  /**
   * Build an UPDATE SET clause with parameterized values
   */
  static buildUpdateClause(
    updates: Record<string, any>,
    startParamIndex: number = 1
  ): { clause: string; params: any[]; nextParamIndex: number } {
    const params: any[] = [];
    const clauses: string[] = [];
    let paramIndex = startParamIndex;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    return {
      clause: clauses.length > 0 ? `SET ${clauses.join(", ")}` : "",
      params,
      nextParamIndex: paramIndex,
    };
  }

  /**
   * Escape and validate table/column names to prevent SQL injection
   * Only allows alphanumeric characters and underscores
   */
  static validateIdentifier(identifier: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid database identifier: ${identifier}`);
    }
    return identifier;
  }
}
