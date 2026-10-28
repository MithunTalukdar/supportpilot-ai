import rateLimit from 'express-rate-limit';
import { HttpStatus } from '../constants/http-status.js';
import { ErrorCode } from '../constants/error-codes.js';
import { env } from '../config/env.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 100 : 10, // 10 attempts in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
        requestId: req.id || 'unknown',
      },
    });
  },
});
