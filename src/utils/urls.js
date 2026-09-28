/**
 * Open-redirect protection.
 * Only relative same-origin paths are allowed. Protocol-relative and
 * absolute URLs are rejected.
 */

const UNSAFE = /^([^/\\]|\\\\|\/\/|[a-z]+:)/i;

/**
 * @param {unknown} candidate
 * @param {string} [fallback='/']
 * @returns {string}
 */
export function safeRedirect(candidate, fallback = '/') {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return fallback;
  }

  if (trimmed.includes('\\') || trimmed.includes('@')) {
    return fallback;
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || UNSAFE.test(trimmed)) {
    return fallback;
  }

  if (trimmed.includes('://')) {
    return fallback;
  }

  return trimmed;
}

/**
 * True when the request appears to want JSON (API clients, fetch + Accept).
 * @param {import('express').Request} req
 */
export function wantsJson(req) {
  const path = req.originalUrl || req.path || '';
  if (path.startsWith('/api/') || path.startsWith('/health')) {
    return true;
  }
  const accept = req.get('accept') || '';
  return req.xhr || /\bapplication\/json\b/i.test(accept);
}
