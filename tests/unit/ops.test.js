import { describe, expect, it } from 'vitest';
import { createLogger } from '#logging/logger.js';
import { createSeqStream } from '#logging/seq.js';
import { parseConfig } from '#config';
import { validTestEnv } from '../helpers/env.js';
import { spawn } from 'node:child_process';
import path from 'node:path';

describe('seq failure isolation', () => {
  it('does not throw when Seq is unreachable', async () => {
    const config = parseConfig(
      validTestEnv({
        SEQ_ENABLED: 'true',
        SEQ_URL: 'http://127.0.0.1:1',
      }),
    );
    const logger = createLogger({ level: 'silent', pretty: false });
    const stream = createSeqStream(config, logger);
    expect(() => stream.write('{}\n')).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});

describe('loadtest host allowlist', () => {
  it('rejects a remote host', async () => {
    const result = await runCli(['http', '--target', 'https://example.com']);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Refusing target host/);
  });
});

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.resolve('tools/loadtest/cli.js'), ...args], {
      env: { ...process.env, NODE_ENV: 'test', LOADTEST_ALLOWED_HOSTS: '127.0.0.1,localhost' },
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (status) => resolve({ status, stderr }));
  });
}
