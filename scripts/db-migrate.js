#!/usr/bin/env node
import knexFactory from 'knex';
import knexfile from '../knexfile.js';
import { createSqlJsKnex } from '../src/database/knex-config.js';

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env] || knexfile.development;
const provider = process.env.DATABASE_PROVIDER || 'sqlite';
const knex = provider === 'postgres' ? knexFactory(config) : await createSqlJsKnex(config);
try {
  const [batch, log] = await knex.migrate.latest();
  console.log(`Migrated batch ${batch}:`, log.length ? log.join(', ') : 'already up to date');
} finally {
  await knex.destroy();
}
