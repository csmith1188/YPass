# YPass Kiosk Machine

`kioskMachine/` is the local application installed on a physical hall-pass kiosk. It serves the kiosk browser UI, keeps the kiosk credential out of browser JavaScript, forwards kiosk API requests to the central YPass server, and reports heartbeats. It does not decide whether a pass is approved, active, completed, expired, or valid.

## Requirements and setup

The kiosk requires Node.js 18 or newer and a reachable YPass server with `API_ENABLED=true`.

```bash
cd kioskMachine
npm install
npm test
npm start
# or: node app
```

The complete `kioskMachine` directory can be copied to another machine and run independently; it does not need to be located inside the YPass server directory. Run commands from that directory so Node can find `app.js`, `src/`, and `public/`.

Set kiosk environment variables in the process environment or a local `.env` file when needed. Open <http://localhost:4177>, or use the URL printed by the process when `KIOSK_PORT` is changed.

## Enrollment

Enrollment is the normal first-run path:

1. Start the central YPass server and sign in as a manager.
2. Open `/manager`, create an enrollment code for an active location, and copy the displayed code.
3. Start the kiosk and enter the central server URL and code in **Register this kiosk**.
4. The kiosk calls `POST /api/v1/kiosks/enroll`, receives its generated kiosk code and secret, and stores them in local `kiosk-config.json`.
5. Confirm the kiosk shows an online status and a recent heartbeat.

Enrollment codes expire after 10 minutes and can be used once. The kiosk secret is returned only during enrollment. Do not put it in the browser UI, commit `kiosk-config.json`, or paste it into logs.

To replace a lost or compromised secret, a manager uses **Regenerate credentials** on `/manager`, then enters the new enrollment code on the kiosk. The old credential is disabled immediately.

## Configuration

All values are optional during the initial enrollment flow. The kiosk can persist its assigned code, server URL, and secret after enrollment.

| Variable             | Purpose                                                          | Default            |
| -------------------- | ---------------------------------------------------------------- | ------------------ |
| `KIOSK_CODE`         | Assigned central kiosk code; normally supplied by enrollment     | empty              |
| `KIOSK_NAME`         | Local display name                                               | `Hall Pass Kiosk`  |
| `KIOSK_LOCATION`     | Local display location                                           | `Unknown Location` |
| `KIOSK_SECRET`       | Existing credential; use the stored config or enrollment instead | empty              |
| `KIOSK_PORT`         | Local HTTP port                                                  | `4177`             |
| `KIOSK_SERVER_URL`   | Central YPass base URL                                           | empty              |
| `KIOSK_HEARTBEAT_MS` | Heartbeat interval                                               | `15000`            |

Environment values take precedence over the local `kiosk-config.json`. Keep the kiosk process and its config file on the physical kiosk; do not expose the file through the served `public/` directory.

## Local endpoints

These endpoints are served by the kiosk process, not directly by the central server:

- `GET /api/config`: local kiosk identity and registration state
- `POST /api/enroll`: exchange an enrollment code for credentials
- `GET /api/health`: local process and heartbeat state
- `POST /api/heartbeat`: forward a heartbeat to YPass
- `GET /api/options`: load active destination options
- `POST /api/scan`: send a student scan
- `POST /api/request-pass`: request a pass for a student and destination

The proxy forwards authenticated requests to `/api/v1/kiosks/*` with `x-kiosk-code` and `x-kiosk-secret`. The browser only talks to the local kiosk process.

## Testing and operations

```bash
npm test
npm run dev
```

The kiosk sends heartbeats every 15 seconds by default and refreshes destination options after registration. If the kiosk is offline, first check the local process, then `KIOSK_SERVER_URL`, central health at `/health/ready`, and whether the credential was regenerated. A `409` registration state means the kiosk has not enrolled; a `502` from a local proxy action means the central server could not be reached or rejected the request.
