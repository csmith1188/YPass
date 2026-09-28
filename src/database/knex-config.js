/**
 * Knex configuration shared by the runtime adapter and CLI scripts.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import initSqlJs from 'sql.js';
import { wrapSqlJsDatabase } from './sqljs-driver.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../..');
const require = createRequire(import.meta.url);

/**
 * @param {object} [config]
 * @param {NodeJS.ProcessEnv} [env]
 */
export function buildKnexConfig(config, env = process.env) {
  const provider = config?.database.provider || env.DATABASE_PROVIDER || 'sqlite';
  const url = config?.database.url || env.DATABASE_URL || './data/app.sqlite';
  const migrations = {
    directory: path.join(projectRoot, 'src/database/migrations'),
    loadExtensions: ['.js'],
    disableTransactions: provider !== 'postgres',
  };
  const seeds = {
    directory: path.join(projectRoot, 'src/database/seeds'),
    loadExtensions: ['.js'],
  };

  if (provider === 'postgres') {
    const sslMode = config?.database.ssl || env.DATABASE_SSL || 'disable';
    let ssl = false;
    if (sslMode === 'require') {
      ssl = { rejectUnauthorized: true };
      const ca = config?.database.sslCa || env.DATABASE_SSL_CA;
      if (ca) {
        ssl.ca = ca;
      }
    }

    return {
      client: 'pg',
      connection: {
        connectionString: url,
        ssl,
      },
      pool: {
        min: config?.database.poolMin ?? 0,
        max: config?.database.poolMax ?? 10,
      },
      migrations,
      seeds,
    };
  }

  const filename = url === ':memory:' ? ':memory:' : path.resolve(projectRoot, url);

  return {
    client: 'better-sqlite3',
    connection: { filename },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
    migrations,
    seeds,
    // Native better-sqlite3 is replaced at runtime in createSqlJsKnex().
    __sqlJsFilename: filename,
  };
}

/**
 * Create a Knex instance whose SQLite driver is sql.js (WASM), not better-sqlite3.
 *
 * @param {object} knexConfig
 */
export async function createSqlJsKnex(knexConfig) {
  const knexModule = (await import('knex')).default;
  const ClientBetterSqlite3 = require('knex/lib/dialects/better-sqlite3');
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ wasmBinary: readFileSync(wasmPath) });

  const filename = knexConfig.__sqlJsFilename || knexConfig.connection.filename;
  if (filename !== ':memory:') {
    mkdirSync(path.dirname(filename), { recursive: true });
  }

  const fileBuffer =
    filename !== ':memory:' && existsSync(filename) ? readFileSync(filename) : undefined;
  const native = new SQL.Database(fileBuffer);

  const persist = () => {
    if (filename === ':memory:') {
      return;
    }
    const data = native.export();
    writeFileSync(filename, Buffer.from(data));
  };

  native.run('PRAGMA foreign_keys = ON');
  const wrapped = wrapSqlJsDatabase(native, {
    filename,
    persist: process.env.NODE_ENV === 'test' ? undefined : persist,
  });

  class ClientSqlJs extends ClientBetterSqlite3 {
    _driver() {
      return class SqlJsShim {};
    }

    async acquireRawConnection() {
      return wrapped;
    }

    async destroyRawConnection() {
      // sql.js uses a single in-memory database. Closing it when the pool
      // releases a connection would destroy schema created by migrations.
    }

    async destroy(callback) {
      persist();
      try {
        native.close();
      } catch {
        /* already closed */
      }
      return super.destroy(callback);
    }
  }

  return knexModule({
    ...knexConfig,
    client: ClientSqlJs,
  });
}
