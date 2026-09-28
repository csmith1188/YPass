# Request lifecycle

1. Nginx terminates TLS and sets `X-Forwarded-*`.
2. PM2 workers accept the request (`HOST=127.0.0.1`).
3. Request ID, Helmet/CSP nonce, parsers, session, CSRF, rate limit, current user.
4. Route → controller → service → repository/integration.
5. Errors pass through `errorHandler`. Production users never see stack traces.
6. Shutdown sets ready=false, drains HTTP, closes Socket.IO, Formbar WS, jobs, database, Redis.
