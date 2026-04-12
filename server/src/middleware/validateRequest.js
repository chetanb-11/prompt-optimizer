import { AppError } from './errorHandler.js';

/**
 * Creates a validation middleware for request body fields.
 * @param {Array<{field: string, type: string, required: boolean, enum?: string[]}>} rules
 */
export function validateBody(rules) {
  return (req, _res, next) => {
    const errors = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`"${rule.field}" is required.`);
        continue;
      }

      // Skip optional missing fields
      if (value === undefined || value === null) continue;

      // Check type
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`"${rule.field}" must be a string.`);
      }
      if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`"${rule.field}" must be a number.`);
      }
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push(`"${rule.field}" must be an array.`);
      }

      // Check enum
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`"${rule.field}" must be one of: ${rule.enum.join(', ')}.`);
      }

      // Check max length for strings
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`"${rule.field}" exceeds maximum length of ${rule.maxLength} characters.`);
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(' '), 400, 'VALIDATION_ERROR'));
    }

    next();
  };
}
