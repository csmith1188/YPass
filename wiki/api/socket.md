# Socket.IO

Enabled with `SOCKET_IO_ENABLED`. The browser connects to this application, not to Formbar.

## Authentication

The Engine.IO handshake reuses the Express session cookie. Unauthenticated sockets are rejected. Do not send user ids in payloads.

## Events

- Client `ping` `{ message?: string }` (max 200 chars)
- Server `pong` `{ ok: true, at: number }`
- Server `error` `{ message: string }`

Payloads are Zod-validated. Event frequency is limited per socket.

Production uses the WebSocket transport only. The Redis adapter is required when `WEB_CONCURRENCY>1`. HTTP long-polling additionally needs Nginx `ip_hash`.
