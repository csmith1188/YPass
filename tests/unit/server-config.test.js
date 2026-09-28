import { describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';

describe('server config failure', () => {
  it('exits 1 when required configuration is missing', async () => {
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, ['src/server.js'], {
        env: { PATH: process.env.PATH, NODE_ENV: 'production' },
        cwd: process.cwd(),
      });
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('close', (status) => resolve({ status, stderr }));
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Invalid configuration/);
  });
});
