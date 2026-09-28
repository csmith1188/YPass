import { AuthenticationError, AuthorizationError } from '#errors';

/**
 * Require an authenticated session.
 */
export function requireAuthentication() {
  return (req, res, next) => {
    if (!req.session?.userId) {
      if (wantsJson(req)) {
        next(new AuthenticationError());
        return;
      }
      const nextUrl = encodeURIComponent(req.originalUrl || '/');
      res.redirect(`/auth/login?next=${nextUrl}`);
      return;
    }
    next();
  };
}

/**
 * @param {string} roleName
 */
export function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      next(new AuthenticationError());
      return;
    }
    const roles = req.currentUser?.roles || [];
    if (!roles.includes(roleName)) {
      next(new AuthorizationError());
      return;
    }
    next();
  };
}

/**
 * @param {string} permissionName
 */
export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      next(new AuthenticationError());
      return;
    }
    const permissions = req.currentUser?.permissions || [];
    if (!permissions.includes(permissionName)) {
      next(new AuthorizationError());
      return;
    }
    next();
  };
}

function wantsJson(req) {
  const path = req.originalUrl || req.path || '';
  return path.startsWith('/api/') || req.xhr || /\bapplication\/json\b/i.test(req.get('accept') || '');
}
