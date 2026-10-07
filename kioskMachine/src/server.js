import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, saveEnrolledConfig } from './config.js';
import { callKioskApi, enrollKiosk, sendHeartbeat } from './kiosk-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});

      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(raw).entries()));
      }
    });
    req.on('error', reject);
  });
}

async function serveStaticAsset(filePath, res) {
  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

export async function createKioskServer(options = {}) {
  const config = { ...loadConfig(), ...options };
  const state = {
    lastHeartbeatAt: null,
    lastStudent: null,
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          kioskCode: config.kioskCode,
          kioskName: config.kioskName,
          kioskLocation: config.kioskLocation,
          serverUrl: config.serverUrl,
          status: 'online',
          registered: config.registered,
        }),
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/enroll') {
      const payload = await readRequestBody(req);
      try {
        const result = await enrollKiosk({
          serverUrl: String(payload.serverUrl || config.serverUrl),
          enrollmentCode: String(payload.enrollmentCode || ''),
          softwareVersion: String(payload.softwareVersion || 'unknown'),
        });
        Object.assign(config, {
          kioskCode: result.kiosk.code,
          kioskSecret: result.credentials.secret,
          serverUrl: result.serverUrl || config.serverUrl,
          registered: true,
        });
        saveEnrolledConfig(config);
        sendJson(res, { ok: true, kioskCode: config.kioskCode });
      } catch (error) {
        sendJson(res, { ok: false, message: error.message }, 400);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          ok: true,
          kioskCode: config.kioskCode,
          location: config.kioskLocation,
          status: 'online',
          lastHeartbeatAt: state.lastHeartbeatAt,
        }),
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/heartbeat') {
      if (!config.registered) {
        sendJson(res, { ok: false, status: 'unregistered', message: 'Kiosk is not registered.' }, 409);
        return;
      }
      await readRequestBody(req);
      try {
        const result = await sendHeartbeat({ serverUrl: config.serverUrl, config });
        state.lastHeartbeatAt = result.timestamp || new Date().toISOString();
        sendJson(res, { ok: result.ok, ...result });
      } catch (error) {
        sendJson(res, { ok: false, status: 'offline', message: error.message }, 502);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/options') {
      try {
        const result = await callKioskApi({
          serverUrl: config.serverUrl,
          config,
          path: 'options',
          method: 'GET',
        });
        sendJson(res, { ok: true, ...result });
      } catch (error) {
        sendJson(res, { ok: false, message: error.message }, 502);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/scan') {
      const payload = await readRequestBody(req);
      const studentNumber = String(payload.studentNumber || '').trim();
      const studentName = String(payload.studentName || '').trim();

      state.lastStudent = { studentNumber, studentName, scannedAt: new Date().toISOString() };
      try {
        const result = await callKioskApi({
          serverUrl: config.serverUrl,
          config,
          path: 'scan',
          payload: { studentNumber, studentName },
        });
        sendJson(res, { ok: true, ...result });
      } catch (error) {
        sendJson(res, { ok: false, message: error.message }, 400);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/request-pass') {
      const payload = await readRequestBody(req);
      const destinationLocationId = String(payload.destinationLocationId || '').trim();
      const studentNumber = String(payload.studentNumber || '').trim();
      const studentName = String(payload.studentName || '').trim();

      try {
        const result = await callKioskApi({
          serverUrl: config.serverUrl,
          config,
          path: 'request-pass',
          payload: { studentNumber, studentName, destinationLocationId },
        });
        sendJson(res, { ok: true, ...result });
      } catch (error) {
        sendJson(res, { ok: false, message: error.message }, 400);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/') {
      await serveStaticAsset(path.join(publicDir, 'index.html'), res);
      return;
    }

    const requestedFile = path.join(publicDir, url.pathname);
    if (url.pathname.startsWith('/')) {
      await serveStaticAsset(requestedFile, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  await new Promise((resolve) => server.listen(config.port, resolve));

  return {
    server,
    config,
    state,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

if (process.argv[1] === __filename) {
  const config = loadConfig();
  const { server } = await createKioskServer(config);
  console.log(`Kiosk app running at http://localhost:${config.port}`);
  console.log(`Kiosk code: ${config.kioskCode} | Location: ${config.kioskLocation}`);
  server.on('close', () => process.exit(0));
}
