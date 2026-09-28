import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    pool: 'forks',
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
