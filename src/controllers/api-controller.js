export function createApiController(container) {
  return {
    me(req, res) {
      const user = req.currentUser;
      res.json({
        data: {
          id: user.id,
          displayName: user.display_name,
          email: user.primary_email,
          roles: user.roles,
          permissions: user.permissions,
        },
      });
    },
    async exampleFormbarHttp(req, res, next) {
      try {
        if (!container.formbarHttpExample) {
          res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
          return;
        }
        const result = await container.formbarHttpExample.ping();
        res.json({ data: result });
      } catch (error) {
        next(error);
      }
    },
  };
}
