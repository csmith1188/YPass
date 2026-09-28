import { randomUUID } from 'node:crypto';

/**
 * Attach a correlation ID to every request.
 */
export function requestId() {
  return (req, res, next) => {
    const incoming = req.get('x-request-id');
    const id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}
