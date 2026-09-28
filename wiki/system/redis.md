# Redis

Prefix: `{APP_NAME}:{ENV}:`. Uses: sessions, Socket.IO adapter, rate limits, optional jobs.

Production Redis must use authentication/ACLs, private networking, and TLS when not on a trusted network.

There is no silent failover to in-memory stores in a multi-worker deployment. If Redis is required and down, readiness fails.
