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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringUtils = void 0;
const connection_1 = __importDefault(require("../database/connection"));
const logger_1 = __importDefault(require("./logger"));
class MonitoringUtils {
    /**
     * Perform comprehensive health check
     */
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = new Date().toISOString();
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            // Check database health
            const databaseHealthy = yield connection_1.default.healthCheck();
            // Calculate memory usage percentage
            const totalMemory = memoryUsage.heapTotal;
            const usedMemory = memoryUsage.heapUsed;
            const memoryPercentage = (usedMemory / totalMemory) * 100;
            // Calculate CPU usage (simplified)
            const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
            const result = {
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
        });
    }
    /**
     * Log system metrics periodically
     */
    static startMetricsLogging(intervalMs = 60000) {
        return setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const metrics = yield _a.healthCheck();
                logger_1.default.info('System metrics:', {
                    uptime: metrics.uptime,
                    memory: metrics.services.memory,
                    cpu: metrics.services.cpu,
                    database: metrics.services.database,
                });
            }
            catch (error) {
                logger_1.default.error('Failed to log metrics:', error);
            }
        }), intervalMs);
    }
}
exports.MonitoringUtils = MonitoringUtils;
_a = MonitoringUtils;
/**
 * Express middleware for health check endpoint
 */
MonitoringUtils.healthCheckHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const healthResult = yield _a.healthCheck();
        const statusCode = healthResult.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthResult);
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
/**
 * Performance monitoring decorator
 */
MonitoringUtils.measurePerformance = (fn, name) => {
    return ((...args) => {
        const start = Date.now();
        const result = fn(...args);
        if (result instanceof Promise) {
            return result
                .then((value) => {
                const duration = Date.now() - start;
                logger_1.default.info(`Performance: ${name} completed in ${duration}ms`);
                return value;
            })
                .catch((error) => {
                const duration = Date.now() - start;
                logger_1.default.error(`Performance: ${name} failed after ${duration}ms`, error);
                throw error;
            });
        }
        else {
            const duration = Date.now() - start;
            logger_1.default.info(`Performance: ${name} completed in ${duration}ms`);
            return result;
        }
    });
};
/**
 * Request metrics middleware
 */
MonitoringUtils.requestMetrics = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url } = req;
        const { statusCode } = res;
        logger_1.default.info('Request metrics:', {
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
