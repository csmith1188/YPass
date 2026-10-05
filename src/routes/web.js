import { Router } from 'express';
import { createWebController } from '#controllers/web-controller.js';
import { requireAuthentication, requireManager } from '#middleware/auth.js';
import { validate } from '#middleware/validate.js';
import { createPassRequestSchema, kioskScanSchema } from '#validators/pass.js';
import { appointmentSchema, managerFilterSchema, passActionSchema } from '#validators/staff.js';

export function createWebRouter(container) {
  const router = Router();
  const controller = createWebController(container);
  router.get('/', controller.home);
  router.get('/example', requireAuthentication(), controller.example);
  router.get('/teacher', requireAuthentication(), controller.teacher);
  router.post('/teacher/pass', requireAuthentication(), validate(passActionSchema), controller.teacherAction);
  router.get('/teacher/appointment', requireAuthentication(), controller.appointment);
  router.post('/teacher/appointment', requireAuthentication(), validate(appointmentSchema), controller.createAppointment);
  router.get('/kiosk', requireAuthentication(), controller.kiosk);
  router.post('/kiosk/scan', requireAuthentication(), validate(kioskScanSchema), controller.scanKiosk);
  router.post('/kiosk/pass', requireAuthentication(), validate(createPassRequestSchema), controller.createKioskPass);
  router.get('/manager', requireAuthentication(), requireManager(container.config.managers), validate(managerFilterSchema, 'query'), controller.manager);
  return router;
}
