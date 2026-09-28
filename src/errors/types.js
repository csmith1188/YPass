/**
 * Standardized application errors.
 *
 * Public HTTP responses expose `message` and `code` only when `expose` is true.
 * Internal logs may include `details` but must never include secrets.
 */

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {number} [options.status]
   * @param {string} [options.code]
   * @param {boolean} [options.expose]
   * @param {unknown} [options.details]
   */
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', expose = false, details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.expose = expose;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', expose: true, details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details) {
    super(message, { status: 401, code: 'AUTHENTICATION_ERROR', expose: true, details });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details) {
    super(message, { status: 403, code: 'AUTHORIZATION_ERROR', expose: true, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', details) {
    super(message, { status: 404, code: 'NOT_FOUND', expose: true, details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, { status: 409, code: 'CONFLICT', expose: true, details });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details) {
    super(message, { status: 429, code: 'RATE_LIMIT', expose: true, details });
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'An external service failed', details) {
    super(message, { status: 502, code: 'EXTERNAL_SERVICE_ERROR', expose: false, details });
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred', details) {
    super(message, { status: 500, code: 'DATABASE_ERROR', expose: false, details });
  }
}

export class CsrfError extends AppError {
  constructor(message = 'Invalid or missing CSRF token') {
    super(message, { status: 403, code: 'CSRF_ERROR', expose: true });
  }
}
