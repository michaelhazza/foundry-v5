import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../errors';

// Standard rate limit: 60 requests per minute
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const error = new RateLimitError(60);
    res.status(error.statusCode).json(error.toJSON());
  },
});

// Auth rate limit: 5 requests per minute (for login, password reset)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const error = new RateLimitError(60);
    res.status(error.statusCode).json(error.toJSON());
  },
});

// Processing rate limit: 5 requests per minute per org
export const processingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use organisation ID if available, otherwise IP
    return (req as any).organisationId?.toString() || req.ip || 'unknown';
  },
  handler: (_req, res) => {
    const error = new RateLimitError(60);
    res.status(error.statusCode).json(error.toJSON());
  },
});
