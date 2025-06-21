import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    // Use IP address as the key, but could be enhanced with user ID for authenticated requests
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      // Initialize or reset the counter
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    } else {
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
      logger.warn(`Rate limit exceeded for ${key}. Count: ${count}`);
      
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

// Create default rate limiter instances
export const generalRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 auth requests per 15 minutes
