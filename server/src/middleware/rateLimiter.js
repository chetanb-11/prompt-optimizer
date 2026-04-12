import rateLimit from 'express-rate-limit';

/**
 * Rate limiter: 30 requests per minute per IP.
 * Prevents abuse of the Gemini API through our proxy.
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
});
