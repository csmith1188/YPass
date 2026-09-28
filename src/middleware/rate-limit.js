import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { RateLimitError } from '#errors';

function rateLimitHandler(req, res, next) {
  next(new RateLimitError());
}

function keyGenerator(req) {
  if (req.session?.userId) {
    return `user:${req.session.userId}`;
  }
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');
}

/**
 * @param {object} config
 * @param {object | null} redis
 */
export function createRateLimiters(config, redis) {
  const store = redis
    ? new RedisStore({
        sendCommand: (...args) => redis.client.sendCommand(args),
        prefix: `${redis.prefix}rl:`,
      })
    : undefined;

  if (config.webConcurrency > 1 && !redis) {
    throw new Error('Distributed rate limiting requires Redis when WEB_CONCURRENCY>1');
  }

  const common = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
    store,
  };

  return {
    general: rateLimit({
      ...common,
      windowMs: config.rateLimit.generalWindowMs,
      limit: config.rateLimit.generalMax,
    }),
    auth: rateLimit({
      ...common,
      windowMs: config.rateLimit.authWindowMs,
      limit: config.rateLimit.authMax,
    }),
  };
}
