/**
 * Knex CLI configuration. Reads DATABASE_* from the environment without
 * requiring every application feature flag to be valid.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { buildKnexConfig } from './src/database/knex-config.js';

const envPath = path.resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  loadDotenv({ path: envPath, override: false });
}

const knexConfig = buildKnexConfig(undefined, process.env);

export default {
  development: knexConfig,
  test: knexConfig,
  production: knexConfig,
};
