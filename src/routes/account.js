import { Router } from 'express';
import { createAccountController } from '#controllers/account-controller.js';
import { requireAuthentication } from '#middleware/auth.js';
import { validate } from '#middleware/validate.js';
import { changePasswordSchema, unlinkSchema } from '#validators/auth.js';

export function createAccountRouter(container) {
  const router = Router();
  const controller = createAccountController(container);
  router.use(requireAuthentication());
  router.get('/', controller.show);
  if (container.config.features.localAuth) {
    router.post('/password', validate(changePasswordSchema), controller.changePassword);
  }
  router.post('/unlink', validate(unlinkSchema), controller.unlink);
  return router;
}
