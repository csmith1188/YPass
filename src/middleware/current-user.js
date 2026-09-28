/**
 * Load the current user onto the request when a session userId exists.
 */
export function loadCurrentUser(userService) {
  return async (req, res, next) => {
    try {
      if (!req.session?.userId) {
        res.locals.currentUser = null;
        next();
        return;
      }
      const user = await userService.findByIdWithAuthz(req.session.userId);
      if (!user || user.status !== 'active') {
        req.session.userId = undefined;
        res.locals.currentUser = null;
        next();
        return;
      }
      req.currentUser = user;
      res.locals.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
