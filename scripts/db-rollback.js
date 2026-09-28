#!/usr/bin/env node
import knexFactory from 'knex';
import knexfile from '../knexfile.js';
import { createSqlJsKnex } from '../src/database/knex-config.js';

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env] || knexfile.development;
const provider = process.env.DATABASE_PROVIDER || 'sqlite';
const knex = provider === 'postgres' ? knexFactory(config) : await createSqlJsKnex(config);
try {
  const [batch, log] = await knex.migrate.rollback();
  console.log(`Rolled back batch ${batch}:`, log.length ? log.join(', ') : 'nothing to roll back');
} finally {
  await knex.destroy();
}
