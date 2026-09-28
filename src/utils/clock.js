/**
 * Clock abstraction so tests can freeze time without patching Date globally
 * in production code paths.
 */
export function systemClock() {
  return {
    now() {
      return new Date();
    },
    nowMs() {
      return Date.now();
    },
  };
}
