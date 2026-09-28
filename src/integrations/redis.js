/**
 * Redis client factory.
 *
 * Redis is never treated as a public trusted service. Production must use
 * authentication, private networking, and TLS when traffic leaves a trusted network.
 * This module does not fail over to process memory.
 */

import { createClient } from 'redis';

/**
 * @param {object} config
 * @param {import('pino').Logger} logger
 */
export async function createRedis(config, logger) {
  const client = createClient({
    url: config.redis.url,
    password: config.redis.password || undefined,
    socket: {
      tls: config.redis.tls || undefined,
      reconnectStrategy(retries) {
        const delay = Math.min(1000 * 2 ** retries, 15_000);
        logger.warn({ retries, delay }, 'redis reconnecting');
        return delay;
      },
    },
  });

  let ready = false;
  client.on('error', (error) => {
    ready = false;
    logger.error({ err: error }, 'redis client error');
  });
  client.on('ready', () => {
    ready = true;
    logger.info('redis ready');
  });

  const connectPromise = client.connect();
  const timeout = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error('Redis connection timed out')),
      config.redis.requiredTimeoutMs,
    );
  });

  await Promise.race([connectPromise, timeout]);

  return {
    client,
    prefix: config.redis.keyPrefix,
    isReady() {
      return ready && client.isOpen;
    },
    async health() {
      try {
        const pong = await client.ping();
        return { ok: pong === 'PONG' };
      } catch (error) {
        logger.error({ err: error }, 'redis health check failed');
        return { ok: false };
      }
    },
    async quit() {
      if (client.isOpen) {
        await client.quit();
      }
    },
  };
}
