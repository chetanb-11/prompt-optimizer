/**
 * Global error handler middleware.
 * Catches all errors thrown in route handlers and services,
 * returning a consistent JSON error response.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export function errorHandler(err, _req, res, _next) {
  // Default values
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  // Log non-operational (unexpected) errors
  if (!err.isOperational) {
    console.error('❌ Unexpected Error:', err);
  }

  res.status(statusCode).json({
    error: true,
    message,
    code,
    ...(statusCode === 429 && { retryAfter: 60 }),
  });
}
