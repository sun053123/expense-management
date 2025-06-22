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
exports.DatabaseHelpers = exports.PostgreSQLDatabase = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
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
    constructor() {
        this.isConnected = false;
        // Initialize connection pool with optimized settings
        this.pool = new pg_1.Pool({
            connectionString: config_1.config.database.url,
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
    setupEventHandlers() {
        this.pool.on("connect", (client) => {
            logger_1.default.info("New database connection established");
        });
        this.pool.on("acquire", (client) => {
            logger_1.default.debug("Connection acquired from pool");
        });
        this.pool.on("error", (err, client) => {
            logger_1.default.error("Database pool error:", err);
        });
        this.pool.on("remove", (client) => {
            logger_1.default.debug("Connection removed from pool");
        });
    }
    /**
     * Initialize database connection and verify connectivity
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Test connection with a simple query
                yield this.query("SELECT 1 as test");
                this.isConnected = true;
                logger_1.default.info("✅ PostgreSQL database connected successfully");
            }
            catch (error) {
                this.isConnected = false;
                logger_1.default.error("❌ Failed to connect to PostgreSQL database:", error);
                throw new Error("Database connection failed");
            }
        });
    }
    /**
     * Close all database connections
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pool.end();
                this.isConnected = false;
                logger_1.default.info("✅ Database connections closed successfully");
            }
            catch (error) {
                logger_1.default.error("❌ Error closing database connections:", error);
                throw error;
            }
        });
    }
    /**
     * Execute a parameterized query with automatic error handling
     *
     * @param text - SQL query string with parameter placeholders ($1, $2, etc.)
     * @param params - Array of parameter values
     * @returns Query result
     */
    query(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            try {
                const result = yield this.pool.query(text, params);
                const duration = Date.now() - start;
                // Log query performance in development
                if (config_1.config.nodeEnv === "development") {
                    logger_1.default.debug(`Query executed in ${duration}ms:`, {
                        query: text,
                        params: params ? "[REDACTED]" : undefined,
                        rowCount: result.rowCount,
                    });
                }
                return result;
            }
            catch (error) {
                const duration = Date.now() - start;
                logger_1.default.error(`Query failed after ${duration}ms:`, {
                    query: text,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                throw error;
            }
        });
    }
    /**
     * Execute a query and return the first row or null
     * Useful for queries that should return a single record
     */
    queryOne(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(text, params);
            return result.rows[0] || null;
        });
    }
    /**
     * Execute a query and return all rows
     * Useful for queries that return multiple records
     */
    queryMany(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(text, params);
            return result.rows;
        });
    }
    /**
     * Execute multiple queries within a transaction
     * Automatically handles commit/rollback based on success/failure
     *
     * @param callback - Function that receives a client and executes queries
     * @returns Result of the callback function
     */
    transaction(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.pool.connect();
            try {
                yield client.query("BEGIN");
                const result = yield callback(client);
                yield client.query("COMMIT");
                logger_1.default.debug("Transaction completed successfully");
                return result;
            }
            catch (error) {
                yield client.query("ROLLBACK");
                logger_1.default.error("Transaction rolled back due to error:", error);
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    /**
     * Check database health and connectivity
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const start = Date.now();
                const result = yield this.query("SELECT NOW() as current_time, version() as version");
                const responseTime = Date.now() - start;
                return {
                    healthy: true,
                    details: {
                        connected: this.isConnected,
                        responseTime: `${responseTime}ms`,
                        currentTime: (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.current_time,
                        version: (_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.version,
                        poolStats: {
                            totalCount: this.pool.totalCount,
                            idleCount: this.pool.idleCount,
                            waitingCount: this.pool.waitingCount,
                        },
                    },
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    details: {
                        connected: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        });
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
    isHealthy() {
        return this.isConnected;
    }
}
exports.PostgreSQLDatabase = PostgreSQLDatabase;
// Create singleton instance
const database = new PostgreSQLDatabase();
// Export singleton instance and types
exports.default = database;
/**
 * Helper functions for common database operations
 */
class DatabaseHelpers {
    /**
     * Build a WHERE clause with parameterized conditions
     * Helps prevent SQL injection while building dynamic queries
     */
    static buildWhereClause(conditions, startParamIndex = 1) {
        const params = [];
        const clauses = [];
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
    static buildUpdateClause(updates, startParamIndex = 1) {
        const params = [];
        const clauses = [];
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
    static validateIdentifier(identifier) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
            throw new Error(`Invalid database identifier: ${identifier}`);
        }
        return identifier;
    }
}
exports.DatabaseHelpers = DatabaseHelpers;
