/**
 * Shared Formbar Socket.IO connection manager.
 * Application code must subscribe here instead of opening extra Formbar sockets.
 */

import { io } from 'socket.io-client';
import { EventEmitter } from 'node:events';

export function createFormbarWsManager({ config, logger }) {
  const bus = new EventEmitter();
  bus.setMaxListeners(50);

  let socket = null;
  let status = 'disconnected';
  let attempt = 0;
  let stopped = false;
  let reconnectTimer = null;

  function headers() {
    if (config.formbar.apiKey) {
      return { api: config.formbar.apiKey };
    }
    return {};
  }

  function connect() {
    if (stopped) {
      return;
    }
    status = 'connecting';
    socket = io(config.formbar.baseUrl, {
      extraHeaders: headers(),
      reconnection: false,
      timeout: 10_000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      attempt = 0;
      status = 'connected';
      logger.info('formbar websocket connected');
      bus.emit('status', status);
    });

    socket.on('disconnect', (reason) => {
      status = 'disconnected';
      logger.warn({ reason }, 'formbar websocket disconnected');
      bus.emit('status', status);
      scheduleReconnect();
    });

    socket.on('connect_error', (error) => {
      status = 'error';
      logger.warn({ err: error }, 'formbar websocket connect error');
      bus.emit('status', status);
      socket.close();
      scheduleReconnect();
    });

    socket.onAny((event, ...args) => {
      bus.emit('event', event, ...args);
      bus.emit(event, ...args);
    });
  }

  function scheduleReconnect() {
    if (stopped) {
      return;
    }
    attempt += 1;
    const delay = Math.min(1000 * 2 ** attempt, 30_000) + Math.floor(Math.random() * 250);
    reconnectTimer = setTimeout(() => connect(), delay);
  }

  return {
    start() {
      stopped = false;
      connect();
    },
    async stop() {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socket) {
        socket.removeAllListeners();
        socket.close();
        socket = null;
      }
      status = 'disconnected';
    },
    getStatus() {
      return status;
    },
    subscribe(event, handler) {
      bus.on(event, handler);
      return () => bus.off(event, handler);
    },
  };
}

/**
 * Example listener. Registers no HTTP routes. Production config forces this off.
 */
export function createFormbarWsExample(wsManager, logger) {
  return wsManager.subscribe('classUpdate', (payload) => {
    logger.debug({ classId: payload?.id }, 'formbar example received classUpdate');
  });
}
