import { Router } from 'express';
import { createHealthController } from '#controllers/health-controller.js';

export function createHealthRouter(container) {
  const router = Router();
  const controller = createHealthController(container);
  router.get('/live', controller.live);
  router.get('/ready', controller.ready);
  return router;
}
