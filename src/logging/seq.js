/**
 * Optional Seq telemetry. Failures never crash the process.
 * Seq is not the application database.
 */

import { Writable } from 'node:stream';

export function createSeqStream(config, fallbackLogger) {
  if (!config.features.seq) {
    return null;
  }

  let open = true;
  let failures = 0;

  const stream = new Writable({
    objectMode: true,
    write(chunk, _encoding, callback) {
      if (!open) {
        callback();
        return;
      }
      const line = typeof chunk === 'string' ? chunk : chunk.toString();
      const url = `${config.seq.url}/ingest/clef`;
      fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/vnd.serilog.clef',
          ...(config.seq.apiKey ? { 'x-seq-apikey': config.seq.apiKey } : {}),
        },
        body: line,
        signal: AbortSignal.timeout(3000),
      }).catch((error) => {
        failures += 1;
        if (failures === 1 || failures % 20 === 0) {
          fallbackLogger.warn({ err: error }, 'seq ingest failed; continuing with local logs');
        }
        if (failures > 50) {
          open = false;
        }
      });
      callback();
    },
  });

  stream.on('error', (error) => {
    fallbackLogger.warn({ err: error }, 'seq stream error');
  });

  return stream;
}
