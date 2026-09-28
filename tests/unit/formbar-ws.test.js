import { describe, expect, it, vi } from 'vitest';
import { createFormbarWsManager } from '#integrations/formbar/ws-client.js';
import { parseConfig } from '#config';
import { validTestEnv } from '../helpers/env.js';
import { createLogger } from '#logging/logger.js';

vi.mock('socket.io-client', () => {
  const handlers = {};
  const socket = {
    on(event, handler) {
      handlers[event] = handler;
    },
    onAny() {},
    removeAllListeners() {},
    close() {},
  };
  return {
    io: () => socket,
    __handlers: handlers,
    __socket: socket,
  };
});

describe('formbar ws manager', () => {
  it('exposes connection status and can stop cleanly', async () => {
    const config = parseConfig(validTestEnv({ FORMBAR_WS_CLIENT_ENABLED: 'true' }));
    const manager = createFormbarWsManager({
      config,
      logger: createLogger({ level: 'silent', pretty: false }),
    });
    manager.start();
    expect(['connecting', 'disconnected', 'error', 'connected']).toContain(manager.getStatus());
    await manager.stop();
    expect(manager.getStatus()).toBe('disconnected');
  });
});
