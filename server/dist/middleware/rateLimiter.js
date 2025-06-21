"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.generalRateLimiter = exports.RateLimiter = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class RateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
        this.store = {};
        this.middleware = (req, res, next) => {
            const key = this.getKey(req);
            const now = Date.now();
            if (!this.store[key] || this.store[key].resetTime < now) {
                // Initialize or reset the counter
                this.store[key] = {
                    count: 1,
                    resetTime: now + this.windowMs,
                };
            }
            else {
                // Increment the counter
                this.store[key].count++;
            }
            const { count, resetTime } = this.store[key];
            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': this.maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, this.maxRequests - count).toString(),
                'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            });
            if (count > this.maxRequests) {
                logger_1.default.warn(`Rate limit exceeded for ${key}. Count: ${count}`);
                res.status(429).json({
                    success: false,
                    error: 'Too many requests, please try again later.',
                    retryAfter: Math.ceil((resetTime - now) / 1000),
                });
                return;
            }
            next();
        };
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    cleanup() {
        const now = Date.now();
        Object.keys(this.store).forEach(key => {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
            }
        });
    }
    getKey(req) {
        // Use IP address as the key, but could be enhanced with user ID for authenticated requests
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
}
exports.RateLimiter = RateLimiter;
// Create default rate limiter instances
exports.generalRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
exports.authRateLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 auth requests per 15 minutes
