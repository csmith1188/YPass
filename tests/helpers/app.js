import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { parseConfig } from '#config';
import { createContainer } from '../../src/container.js';
import { createApp } from '../../src/app.js';
import { validTestEnv } from './env.js';

export async function createTestApp(overrides = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'fbapp-'));
  const dbFile = path.join(dir, 'test.sqlite');
  const config = parseConfig(
    validTestEnv({
      DATABASE_URL: dbFile,
      DATABASE_MIGRATE_ON_START: 'false',
      SOCKET_IO_ENABLED: 'false',
      ...overrides,
    }),
  );
  const { createLogger } = await import('#logging/logger.js');
  const logger = createLogger({ level: 'silent', env: 'test', pretty: false });
  const container = await createContainer({ config, logger });
  await container.db.knex.migrate.latest();
  await container.db.knex.seed.run();
  const { app } = createApp(container);

  async function close() {
    await container.db.destroy();
    await rm(dir, { recursive: true, force: true });
  }

  return { app, request: request(app), container, config, close };
}
