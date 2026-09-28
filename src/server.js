/**
 * Process entrypoint.
 *
 * Loads and validates configuration before constructing the HTTP server.
 * Invalid configuration prints a clear aggregated error and exits 1.
 */

import { loadConfig, ConfigError } from '#config';
import { createLogger } from '#logging/logger.js';

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    console.error(error);
    process.exitCode = 1;
    return;
  }

  const logger = createLogger({
    level: config.log.level,
    appName: config.appName,
    env: config.env,
    pretty: config.isDevelopment,
  });

  const { startServer } = await import('./bootstrap.js');
  await startServer({ config, logger });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
