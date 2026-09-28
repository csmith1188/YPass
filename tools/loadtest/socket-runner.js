import { io } from 'socket.io-client';
import { summarize } from './http-runner.js';

export async function runSockets({ target, users, eventsPerSecond, durationSeconds, sockets }) {
  const latencies = [];
  let success = 0;
  let failure = 0;
  const created = [];

  for (let i = 0; i < users; i += 1) {
    const socket = io(target, { transports: ['websocket'], reconnection: false, timeout: 5000 });
    created.push(socket);
    sockets.push(socket);
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        failure += 1;
        resolve();
      }, 5000);
      socket.on('connect', () => {
        clearTimeout(timer);
        success += 1;
        resolve();
      });
      socket.on('connect_error', () => {
        clearTimeout(timer);
        failure += 1;
        resolve();
      });
    });
  }

  const end = Date.now() + durationSeconds * 1000;
  while (Date.now() < end && eventsPerSecond > 0) {
    for (const socket of created.filter((item) => item.connected)) {
      const started = Date.now();
      await new Promise((resolve) => {
        socket.timeout(2000).emit('ping', { message: 'load' }, () => {
          latencies.push(Date.now() - started);
          resolve();
        });
        setTimeout(resolve, 2100);
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 / eventsPerSecond));
  }

  return summarize(success, failure, latencies, durationSeconds);
}

export function disconnectMany(sockets, percent) {
  const count = Math.ceil((sockets.length * percent) / 100);
  let closed = 0;
  for (const socket of sockets.splice(0, count)) {
    socket.close();
    closed += 1;
  }
  return { success: closed, failure: 0, throughput: 0, latencyMs: { p50: 0, p95: 0, max: 0 } };
}
