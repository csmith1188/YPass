import session from 'express-session';
import { RedisStore } from 'connect-redis';
import MemoryStoreFactory from 'memorystore';

const MemoryStore = MemoryStoreFactory(session);

/**
 * Server-side sessions. Production/cluster uses Redis.
 * Memory store is allowed only for a single worker when Redis is disabled.
 */
export function createSessionMiddleware(config, redis) {
  if (config.webConcurrency > 1 && !redis) {
    throw new Error('Shared session store (Redis) is required when WEB_CONCURRENCY>1');
  }

  if (config.isProduction && config.webConcurrency > 1 && !redis) {
    throw new Error('Production cluster sessions require Redis');
  }

  const store = redis
    ? new RedisStore({
        client: redis.client,
        prefix: `${redis.prefix}sess:`,
      })
    : new MemoryStore({
        checkPeriod: 10 * 60 * 1000,
      });

  return session({
    name: config.session.cookieName,
    secret: config.session.secret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: config.session.idleMs,
    },
  });
}

/**
 * Reject sessions that exceeded the absolute lifetime.
 */
export function enforceAbsoluteSessionTimeout(config) {
  return (req, res, next) => {
    if (!req.session) {
      next();
      return;
    }
    if (!req.session.createdAt) {
      req.session.createdAt = Date.now();
    }
    if (Date.now() - req.session.createdAt > config.session.absoluteMs) {
      req.session.destroy(() => {
        res.clearCookie(config.session.cookieName);
        if (req.path.startsWith('/api/')) {
          res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired' } });
          return;
        }
        res.redirect('/auth/login');
      });
      return;
    }
    next();
  };
}

/**
 * Regenerate the session to prevent fixation. Call after login and privilege changes.
 *
 * @param {import('express').Request} req
 * @param {object} data
 */
export function regenerateSession(req, data) {
  return new Promise((resolve, reject) => {
    const createdAt = Date.now();
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      Object.assign(req.session, data, { createdAt });
      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Destroy the session and clear the cookie.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {object} config
 */
export function destroySession(req, res, config) {
  return new Promise((resolve, reject) => {
    const sessionId = req.session?.id;
    req.session.destroy((error) => {
      res.clearCookie(config.session.cookieName);
      if (error) {
        reject(error);
        return;
      }
      resolve(sessionId);
    });
  });
}
