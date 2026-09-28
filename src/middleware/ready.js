import { isLoopback } from '#utils/net.js';

/**
 * Readiness gate: once shutdown starts, refuse new work.
 */
export function readyGuard(state) {
  return (req, res, next) => {
    if (req.path.startsWith('/health/')) {
      next();
      return;
    }
    if (!state.ready) {
      res.status(503).json({ error: { code: 'NOT_READY', message: 'Service unavailable' } });
      return;
    }
    next();
  };
}

export { isLoopback };
