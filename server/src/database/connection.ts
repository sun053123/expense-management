import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import database from "./postgres";
import logger from "../utils/logger";

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
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log:
          config.nodeEnv === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
        datasources: {
          db: {
            url: config.database.url,
          },
        },
      });
    }

    return DatabaseConnection.instance;
  }

  /**
   * Connect to the database using both Prisma and raw PostgreSQL
   */
  public static async connect(): Promise<void> {
    try {
      // Connect using our new PostgreSQL helper
      await database.connect();

      // Also connect Prisma for backward compatibility
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();

      logger.info(
        "✅ Database connected successfully (both Prisma and PostgreSQL)"
      );
    } catch (error) {
      logger.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  public static async disconnect(): Promise<void> {
    try {
      // Disconnect PostgreSQL
      await database.disconnect();

      // Disconnect Prisma
      const prisma = DatabaseConnection.getInstance();
      await prisma.$disconnect();

      logger.info("✅ Database disconnected successfully");
    } catch (error) {
      logger.error("❌ Database disconnection failed:", error);
      throw error;
    }
  }

  /**
   * Perform health check on both database connections
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      // Check PostgreSQL connection
      const pgHealth = await database.healthCheck();

      // Check Prisma connection
      const prisma = DatabaseConnection.getInstance();
      await prisma.$queryRaw`SELECT 1`;

      const isHealthy = pgHealth.healthy;

      if (isHealthy) {
        logger.debug("✅ Database health check passed");
      } else {
        logger.warn("❌ Database health check failed");
      }

      return isHealthy;
    } catch (error) {
      logger.error("❌ Database health check failed:", error);
      return false;
    }
  }

  /**
   * Get detailed health information
   */
  public static async getHealthDetails(): Promise<any> {
    try {
      const pgHealth = await database.healthCheck();
      const prismaHealth = await DatabaseConnection.healthCheck();

      return {
        postgresql: pgHealth,
        prisma: {
          healthy: prismaHealth,
          connected: true,
        },
        overall: pgHealth.healthy && prismaHealth,
      };
    } catch (error) {
      logger.error("Error getting database health details:", error);
      return {
        postgresql: { healthy: false, error: "Connection failed" },
        prisma: { healthy: false, error: "Connection failed" },
        overall: false,
      };
    }
  }
}

// Export both Prisma instance (for backward compatibility) and PostgreSQL database
export const prisma = DatabaseConnection.getInstance();
export { database as postgres };
export default DatabaseConnection;
