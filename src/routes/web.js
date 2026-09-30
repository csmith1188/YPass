import { Router } from 'express';
import { createWebController } from '#controllers/web-controller.js';
import { requireAuthentication } from '#middleware/auth.js';

export function createWebRouter(container) {
  const router = Router();
  const controller = createWebController(container);
  router.get('/', controller.home);
  router.get('/example', requireAuthentication(), controller.example);
  router.get('/teacher', requireAuthentication(), controller.teacher);
  router.get('/kiosk', requireAuthentication(), controller.kiosk);
  return router;
}
