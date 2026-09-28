# Socket.IO scaling

Workers share the `@socket.io/redis-adapter`. Production transports default to WebSocket-only, so Nginx sticky sessions are unnecessary.

If `SOCKET_IO_ALLOW_POLLING=true`, configure Nginx `ip_hash` and Redis. Cluster without Redis is a startup error.

Formbar's Socket.IO client is a separate server-to-server connection (`FORMBAR_WS_CLIENT_ENABLED`) and must not be opened from the browser.
