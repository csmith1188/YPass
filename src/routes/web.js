import { Router } from 'express';
import { createWebController } from '#controllers/web-controller.js';
import { requireAuthentication } from '#middleware/auth.js';

export function createWebRouter(container) {
  const router = Router();
  const controller = createWebController(container);
  router.get('/', controller.home);
  router.get('/example', requireAuthentication(), controller.example);
  return router;
}
