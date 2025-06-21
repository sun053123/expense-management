import { Request, Response } from 'express';
import DatabaseConnection from '../database/connection';
import logger from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

export class MonitoringUtils {
  /**
   * Perform comprehensive health check
   */
  static async healthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Check database health
    const databaseHealthy = await DatabaseConnection.healthCheck();

    // Calculate memory usage percentage
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Calculate CPU usage (simplified)
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    const result: HealthCheckResult = {
      status: databaseHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage),
        },
        cpu: {
          usage: Math.round(cpuPercentage),
        },
      },
    };

    return result;
  }

  /**
   * Express middleware for health check endpoint
   */
  static healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthResult = await MonitoringUtils.healthCheck();
      
      const statusCode = healthResult.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthResult);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  };

  /**
   * Log system metrics periodically
   */
  static startMetricsLogging(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const metrics = await MonitoringUtils.healthCheck();
        logger.info('System metrics:', {
          uptime: metrics.uptime,
          memory: metrics.services.memory,
          cpu: metrics.services.cpu,
          database: metrics.services.database,
        });
      } catch (error) {
        logger.error('Failed to log metrics:', error);
      }
    }, intervalMs);
  }

  /**
   * Performance monitoring decorator
   */
  static measurePerformance = <T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: any[]) => {
      const start = Date.now();
      const result = fn(...args);

      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - start;
            logger.info(`Performance: ${name} completed in ${duration}ms`);
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - start;
            logger.error(`Performance: ${name} failed after ${duration}ms`, error);
            throw error;
          });
      } else {
        const duration = Date.now() - start;
        logger.info(`Performance: ${name} completed in ${duration}ms`);
        return result;
      }
    }) as T;
  };

  /**
   * Request metrics middleware
   */
  static requestMetrics = (req: Request, res: Response, next: Function): void => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url } = req;
      const { statusCode } = res;
      
      logger.info('Request metrics:', {
        method,
        url,
        statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });
    
    next();
  };
}
