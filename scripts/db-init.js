#!/usr/bin/env node
/**
 * Initialize the database file/schema by running migrations then seeds.
 * Usage: node scripts/db-init.js [--provider=sqlite|postgres]
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import knexFactory from 'knex';
import knexfile from '../knexfile.js';
import { createSqlJsKnex } from '../src/database/knex-config.js';

const providerArg = process.argv.find((arg) => arg.startsWith('--provider='));
if (providerArg) {
  process.env.DATABASE_PROVIDER = providerArg.split('=')[1];
}

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env] || knexfile.development;
const provider = process.env.DATABASE_PROVIDER || 'sqlite';

if (config.client === 'better-sqlite3' && config.connection?.filename !== ':memory:') {
  await mkdir(path.dirname(config.connection.filename), { recursive: true });
}

const knex = provider === 'postgres' ? knexFactory(config) : await createSqlJsKnex(config);
try {
  await knex.migrate.latest();
  await knex.seed.run();
  console.log('Database initialized (migrations + seeds).');
} finally {
  await knex.destroy();
}
