import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function loadConfig(env = process.env) {
  const dotenvPath = path.join(projectRoot, '.env');

  if (fs.existsSync(dotenvPath)) {
    const raw = fs.readFileSync(dotenvPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').trim();
      if (!(key in env)) {
        env[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  const port = Number(env.KIOSK_PORT ?? 4177);
  const heartbeatMs = Number(env.KIOSK_HEARTBEAT_MS ?? 15000);

  return {
    kioskCode: env.KIOSK_CODE ?? 'KSK-000',
    kioskName: env.KIOSK_NAME ?? 'Hall Pass Kiosk',
    kioskLocation: env.KIOSK_LOCATION ?? 'Unknown Location',
    kioskSecret: env.KIOSK_SECRET ?? 'change-me',
    serverUrl: env.KIOSK_SERVER_URL ?? 'http://localhost:3000',
    port: Number.isFinite(port) ? port : 4177,
    heartbeatMs: Number.isFinite(heartbeatMs) ? heartbeatMs : 15000,
  };
}
