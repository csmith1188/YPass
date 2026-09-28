/**
 * Structured application logger.
 *
 * Use child loggers for request/user context. Never pass passwords,
 * session IDs, tokens, or API keys in log fields.
 */

import pino from 'pino';
import { REDACT_PATHS } from './redaction.js';

/**
 * @param {object} [options]
 * @param {string} [options.level]
 * @param {string} [options.appName]
 * @param {string} [options.env]
 * @param {boolean} [options.pretty]
 * @param {import('pino').DestinationStream} [options.destination]
 */
export function createLogger({
  level = 'info',
  appName = 'formbar-app',
  env = 'development',
  pretty = env === 'development',
  destination,
} = {}) {
  /** @type {import('pino').LoggerOptions} */
  const options = {
    level,
    base: {
      application: appName,
      environment: env,
      workerPid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
  };

  if (pretty && !destination) {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    };
  }

  return destination ? pino(options, destination) : pino(options);
}

/**
 * Audit channel is conceptually distinct from diagnostic logs.
 * Same redaction rules apply.
 *
 * @param {import('pino').Logger} logger
 */
export function createAuditLogger(logger) {
  return logger.child({ channel: 'audit' });
}
