/**
 * Express application factory. Does not listen; bootstrap owns the HTTP server.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import expressLayouts from 'express-ejs-layouts';
import pinoHttp from 'pino-http';
import { requestId } from '#middleware/request-id.js';
import { securityHeaders } from '#middleware/security.js';
import { createSessionMiddleware, enforceAbsoluteSessionTimeout } from '#middleware/session.js';
import { createCsrf } from '#middleware/csrf.js';
import { createRateLimiters } from '#middleware/rate-limit.js';
import { loadCurrentUser } from '#middleware/current-user.js';
import { errorHandler, notFoundHandler } from '#middleware/error.js';
import { registerRoutes } from '#routes/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');

export function createApp(container) {
  const { config, logger } = container;
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', path.join(projectRoot, 'views'));
  app.set('layout', 'layouts/main');
  app.use(expressLayouts);

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customProps: (req) => ({
        requestId: req.requestId,
        userId: req.session?.userId,
      }),
    }),
  );
  app.use(securityHeaders(config));
  app.use(compression());
  app.use(express.urlencoded({ extended: false, limit: config.security.bodyLimit }));
  app.use(express.json({ limit: config.security.bodyLimit }));
  app.use(cookieParser());
  app.use(express.static(path.join(projectRoot, 'public'), { index: false, maxAge: '1h' }));

  if (config.security.corsOrigins.length > 0) {
    app.use(
      cors({
        origin: config.security.corsOrigins,
        credentials: true,
      }),
    );
  }

  const sessionMiddleware = createSessionMiddleware(config, container.redis);
  app.use(sessionMiddleware);
  app.use(enforceAbsoluteSessionTimeout(config));

  const csrf = createCsrf(config);
  app.use(csrf.attachToken);
  app.use(csrf.skipSafeMethods);

  const rateLimiters = createRateLimiters(config, container.redis);
  container.rateLimiters = rateLimiters;
  app.use(rateLimiters.general);

  app.use((req, res, next) => {
    res.locals.appName = config.appName;
    res.locals.features = config.features;
    next();
  });

  app.use(loadCurrentUser(container.userService));
  registerRoutes(app, container);
  app.use(notFoundHandler);
  app.use(errorHandler(config, logger));

  return { app, sessionMiddleware };
}
