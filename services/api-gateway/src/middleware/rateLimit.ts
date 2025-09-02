import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

// Default rate limiter
export const defaultRateLimit = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: CONFIG.RATE_LIMIT.WINDOW_MS / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: CONFIG.RATE_LIMIT.WINDOW_MS / 1000
    });
  }
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many requests to sensitive endpoint, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create custom rate limiter
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded for this endpoint.',
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};
