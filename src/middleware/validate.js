import { ValidationError } from '#errors';

/**
 * Validate request data with a Zod schema before it reaches a controller.
 *
 * @param {import('zod').ZodType} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(toValidationError(result.error));
      return;
    }
    req[source] = result.data;
    next();
  };
}

/**
 * @param {import('zod').ZodError} error
 */
export function toValidationError(error) {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return new ValidationError('Invalid request', details);
}
