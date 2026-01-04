import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key]!.resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string; // Error message
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
}

/**
 * Rate limiting middleware
 * Default: 100 requests per minute per IP
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Use IP address as default key
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or get existing record
    if (!store[key] || store[key]!.resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const record = store[key]!;
    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > max) {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Strict rate limit for sensitive operations (e.g., authentication, payments)
 * 10 requests per minute
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many attempts, please try again in a minute.',
});

/**
 * Standard rate limit for general API endpoints
 * 100 requests per minute
 */
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please slow down.',
});

/**
 * Lenient rate limit for read-only operations
 * 200 requests per minute
 */
export const lenientRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again shortly.',
});
