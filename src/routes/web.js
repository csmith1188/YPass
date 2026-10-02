import { Router } from 'express';
import { createWebController } from '#controllers/web-controller.js';
import { requireAuthentication } from '#middleware/auth.js';
import { validate } from '#middleware/validate.js';
import { createPassRequestSchema, kioskScanSchema } from '#validators/pass.js';

export function createWebRouter(container) {
  const router = Router();
  const controller = createWebController(container);
  router.get('/', controller.home);
  router.get('/example', requireAuthentication(), controller.example);
  router.get('/teacher', requireAuthentication(), controller.teacher);
  router.get('/kiosk', requireAuthentication(), controller.kiosk);
  router.post('/kiosk/scan', requireAuthentication(), validate(kioskScanSchema), controller.scanKiosk);
  router.post('/kiosk/pass', requireAuthentication(), validate(createPassRequestSchema), controller.createKioskPass);
  router.get('/manager', requireAuthentication(), controller.manager);
  return router;
}
