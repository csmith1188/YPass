/**
 * Express 5 handles rejected promises from async handlers.
 * This wrapper remains for Socket.IO and non-Express callbacks.
 *
 * @param {( ...args: any[] ) => Promise<unknown>} fn
 */
export function asyncHandler(fn) {
  return (...args) => {
    const next = args[args.length - 1];
    Promise.resolve(fn(...args)).catch((error) => {
      if (typeof next === 'function' && next.length >= 1) {
        next(error);
        return;
      }
      throw error;
    });
  };
}
