const logger = require('../utils/logger');

// Simple in-memory rate limiter
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100; // Max requests per window
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create request history for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requestHistory = this.requests.get(identifier);

    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);

    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    return true;
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }

    const requestHistory = this.requests.get(identifier);
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier) {
    if (!this.requests.has(identifier)) {
      return Date.now();
    }

    const requestHistory = this.requests.get(identifier);
    if (requestHistory.length === 0) {
      return Date.now();
    }

    const oldestRequest = Math.min(...requestHistory);
    return oldestRequest + this.windowMs;
  }
}

const rateLimiter = new RateLimiter();

const rateLimitMiddleware = (req, res, next) => {
  // Use IP address as identifier (in production, might use user ID)
  const identifier = req.ip || req.connection.remoteAddress || 'unknown';

  if (!rateLimiter.isAllowed(identifier)) {
    const resetTime = rateLimiter.getResetTime(identifier);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    logger.warn(`Rate limit exceeded for ${identifier}`);

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter
    });
  }

  // Add rate limit info to response headers
  const remaining = rateLimiter.getRemainingRequests(identifier);
  const resetTime = rateLimiter.getResetTime(identifier);

  res.set({
    'X-RateLimit-Limit': rateLimiter.maxRequests,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000)
  });

  next();
};

module.exports = rateLimitMiddleware;

