import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Create a singleton Prisma client instance
class DatabaseConnection {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        datasources: {
          db: {
            url: config.database.url,
          },
        },
      });
    }

    return DatabaseConnection.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

export const prisma = DatabaseConnection.getInstance();
export default DatabaseConnection;
