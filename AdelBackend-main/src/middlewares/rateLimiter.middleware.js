import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export const defaultLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMITED',
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMITED',
    });
  },
});

/**
 * Rate limiter for password reset
 * 3 requests per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many password reset attempts, please try again later.',
    code: 'RESET_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      code: 'RESET_RATE_LIMITED',
    });
  },
});

/**
 * Rate limiter for event creation
 * 20 events per hour
 */
export const eventCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'Event creation limit reached, please try again later.',
    code: 'EVENT_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Event creation limit reached, please try again later.',
      code: 'EVENT_RATE_LIMITED',
    });
  },
});

/**
 * Custom rate limiter factory
 * @param {Object} options - Rate limiter options
 */
export function createRateLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      error: options.message || 'Too many requests, please try again later.',
      code: options.code || 'RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    skip: options.skip,
    handler: (req, res) => {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        code: options.code || 'RATE_LIMITED',
      });
    },
  });
}

export default {
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  eventCreationLimiter,
  createRateLimiter,
};

