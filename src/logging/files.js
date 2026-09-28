/**
 * Optional rotating local log files. Prefer stdout for PM2.
 */

import { mkdirSync, renameSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import pino from 'pino';

export function createFileDestination(config) {
  if (!config.log.fileEnabled) {
    return null;
  }
  mkdirSync(config.log.fileDir, { recursive: true });
  const file = path.join(config.log.fileDir, 'app.log');
  rotateIfNeeded(file, config.log.maxBytes, config.log.maxFiles);
  return pino.destination({ dest: file, sync: false, mkdir: true });
}

function rotateIfNeeded(file, maxBytes, maxFiles) {
  if (!existsSync(file)) {
    return;
  }
  const size = statSync(file).size;
  if (size < maxBytes) {
    return;
  }
  for (let i = maxFiles - 1; i >= 1; i -= 1) {
    const from = `${file}.${i}`;
    const to = `${file}.${i + 1}`;
    if (existsSync(from)) {
      renameSync(from, to);
    }
  }
  renameSync(file, `${file}.1`);
}
