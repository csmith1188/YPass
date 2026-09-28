#!/usr/bin/env node
/**
 * Wait for required dependencies (Postgres/Redis) before PM2 start.
 */
import { loadConfig, ConfigError } from '../src/config/index.js';
import knexFactory from 'knex';
import { buildKnexConfig } from '../src/database/knex-config.js';

const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || 30000);
const started = Date.now();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let config;
try {
  config = loadConfig();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

async function waitForDb() {
  const knex = knexFactory(buildKnexConfig(config));
  try {
    while (Date.now() - started < timeoutMs) {
      try {
        await knex.raw('select 1');
        return;
      } catch {
        await sleep(500);
      }
    }
    throw new Error('Timed out waiting for the database');
  } finally {
    await knex.destroy();
  }
}

async function waitForRedis() {
  if (!config.features.redis) {
    return;
  }
  const { createClient } = await import('redis');
  const client = createClient({
    url: config.redis.url,
    password: config.redis.password || undefined,
    socket: config.redis.tls ? { tls: true } : undefined,
  });
  client.on('error', () => {});
  while (Date.now() - started < timeoutMs) {
    try {
      await client.connect();
      await client.ping();
      await client.quit();
      return;
    } catch {
      try {
        await client.quit();
      } catch {
        /* ignore */
      }
      await sleep(500);
    }
  }
  throw new Error('Timed out waiting for Redis');
}

await waitForDb();
await waitForRedis();
console.log('Dependencies ready.');
