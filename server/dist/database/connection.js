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
exports.postgres = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const postgres_1 = __importDefault(require("./postgres"));
exports.postgres = postgres_1.default;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Database Connection Manager
 *
 * This module manages database connections for the application.
 * It provides both Prisma (for backward compatibility) and raw PostgreSQL connections.
 *
 * The authentication system now uses raw PostgreSQL queries for better performance
 * and control, while other parts of the application can still use Prisma if needed.
 */
// Create a singleton Prisma client instance for backward compatibility
class DatabaseConnection {
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new client_1.PrismaClient({
                log: config_1.config.nodeEnv === "development"
                    ? ["query", "info", "warn", "error"]
                    : ["error"],
                datasources: {
                    db: {
                        url: config_1.config.database.url,
                    },
                },
            });
        }
        return DatabaseConnection.instance;
    }
    /**
     * Connect to the database using both Prisma and raw PostgreSQL
     */
    static connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Connect using our new PostgreSQL helper
                yield postgres_1.default.connect();
                // Also connect Prisma for backward compatibility
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$connect();
                logger_1.default.info("✅ Database connected successfully (both Prisma and PostgreSQL)");
            }
            catch (error) {
                logger_1.default.error("❌ Database connection failed:", error);
                throw error;
            }
        });
    }
    /**
     * Disconnect from the database
     */
    static disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Disconnect PostgreSQL
                yield postgres_1.default.disconnect();
                // Disconnect Prisma
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$disconnect();
                logger_1.default.info("✅ Database disconnected successfully");
            }
            catch (error) {
                logger_1.default.error("❌ Database disconnection failed:", error);
                throw error;
            }
        });
    }
    /**
     * Perform health check on both database connections
     */
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check PostgreSQL connection
                const pgHealth = yield postgres_1.default.healthCheck();
                // Check Prisma connection
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$queryRaw `SELECT 1`;
                const isHealthy = pgHealth.healthy;
                if (isHealthy) {
                    logger_1.default.debug("✅ Database health check passed");
                }
                else {
                    logger_1.default.warn("❌ Database health check failed");
                }
                return isHealthy;
            }
            catch (error) {
                logger_1.default.error("❌ Database health check failed:", error);
                return false;
            }
        });
    }
    /**
     * Get detailed health information
     */
    static getHealthDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pgHealth = yield postgres_1.default.healthCheck();
                const prismaHealth = yield DatabaseConnection.healthCheck();
                return {
                    postgresql: pgHealth,
                    prisma: {
                        healthy: prismaHealth,
                        connected: true,
                    },
                    overall: pgHealth.healthy && prismaHealth,
                };
            }
            catch (error) {
                logger_1.default.error("Error getting database health details:", error);
                return {
                    postgresql: { healthy: false, error: "Connection failed" },
                    prisma: { healthy: false, error: "Connection failed" },
                    overall: false,
                };
            }
        });
    }
}
// Export both Prisma instance (for backward compatibility) and PostgreSQL database
exports.prisma = DatabaseConnection.getInstance();
exports.default = DatabaseConnection;
