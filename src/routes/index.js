import { createHealthRouter } from './health.js';
import { createWebRouter } from './web.js';
import { createAuthRouter } from './auth.js';
import { createAccountRouter } from './account.js';
import { createApiV1Router } from './api.v1.js';

export function registerRoutes(app, container) {
  app.use('/health', createHealthRouter(container));
  app.use('/', createWebRouter(container));
  app.use('/auth', createAuthRouter(container));
  app.use('/account', createAccountRouter(container));
  if (container.config.features.api) {
    app.use('/api/v1', createApiV1Router(container));
  }
}
