import { AppError } from './types.js';

/**
 * Map unknown thrown values into AppError instances.
 * Never attach stack traces to the public payload.
 *
 * @param {unknown} error
 * @returns {import('./types.js').AppError}
 */
export function mapError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const status = Number(error.status) || 500;
    return new AppError(String(error.message || 'Request failed'), {
      status,
      code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      expose: status < 500,
    });
  }

  return new AppError('An unexpected error occurred', {
    status: 500,
    code: 'INTERNAL_ERROR',
    expose: false,
    details: error instanceof Error ? error.message : undefined,
  });
}

/**
 * Shape a public error response. Omits stack traces and secrets.
 *
 * @param {import('./types.js').AppError} error
 * @param {boolean} includeDetails
 */
export function toPublicError(error, includeDetails = false) {
  const body = {
    error: {
      code: error.code,
      message: error.expose ? error.message : 'An unexpected error occurred',
    },
  };

  if (includeDetails && error.expose && error.details) {
    body.error.details = error.details;
  }

  return body;
}
