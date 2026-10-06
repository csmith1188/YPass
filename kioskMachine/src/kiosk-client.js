export function buildKioskHeaders(config = {}) {
  return {
    'x-kiosk-code': config.kioskCode ?? '',
    'x-kiosk-secret': config.kioskSecret ?? '',
    'content-type': 'application/json',
  };
}

export function buildHeartbeatPayload(config = {}) {
  return {
    kioskCode: config.kioskCode ?? '',
    location: config.kioskLocation ?? 'Unknown Location',
    name: config.kioskName ?? 'Hall Pass Kiosk',
    status: 'online',
    timestamp: new Date().toISOString(),
  };
}

export function normaliseServerStatus(serverState = {}) {
  return {
    ok: Boolean(serverState.ok),
    server: serverState.server ?? '',
    kiosk: serverState.kiosk ?? '',
    status: serverState.status ?? 'unknown',
    message: serverState.message ?? '',
  };
}

export async function sendHeartbeat({ serverUrl, config, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(new URL('/api/kiosk/heartbeat', serverUrl).toString(), {
    method: 'POST',
    headers: buildKioskHeaders(config),
    body: JSON.stringify(buildHeartbeatPayload(config)),
  });

  const data = await response.json().catch(() => ({}));
  return normaliseServerStatus({
    ok: response.ok,
    server: serverUrl,
    kiosk: config.kioskCode ?? '',
    status: response.ok ? 'online' : 'offline',
    message: data.message ?? (response.ok ? 'heartbeat received' : 'heartbeat failed'),
  });
}
