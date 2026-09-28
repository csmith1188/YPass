# Formbar Node.js Application Boilerplate

Production-grade Express 5 + EJS starter for applications that integrate with [Formbar](https://github.com/csmith1188/Formbar.js). Optional features are explicit flags. Disabled modules do not register routes, sockets, jobs, or background connections.

## Quick start (SQLite, single worker)

```bash
cp .env.example .env
npm install
npm run db:init
npm run dev
```

SQLite for local development uses sql.js (WASM) so you do not need Visual Studio/node-gyp. Production uses PostgreSQL via `pg`. Passwords are hashed with Argon2id (`hash-wasm`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Watch mode |
| `npm start` | Single process |
| `npm run db:init` | Migrate + seed |
| `npm run db:migrate` / `db:rollback` / `db:seed` / `db:status` | Schema |
| `npm test` | All Vitest suites |
| `npm run loadtest` | CLI load harness (localhost only) |
| `npm run lint` / `format` / `audit` | Quality |
| `npm run pm2:start` / `pm2:reload` | Ubuntu cluster |
| `npm run docker:up` / `docker:down` / `docker:logs` | Compose (host Nginx on loopback) |

## Feature flags

See `.env.example` and [wiki/system/feature-flags.md](wiki/system/feature-flags.md). Production forces example/debug/load-test HTTP off and rejects SQLite clustering and silent Redis failover. Current Formbar production uses `FORMBAR_OAUTH_MODE=legacy_redirect`.

## Documentation

Markdown in [`wiki/`](wiki/) is intended for a GitHub Wiki and is published on push to `main` by [`.github/workflows/wiki.yml`](.github/workflows/wiki.yml). OpenAPI lives in [`docs/openapi/v1.yaml`](docs/openapi/v1.yaml). Ubuntu Nginx/PM2 and Docker Compose notes are in [`deploy/ubuntu/setup.md`](deploy/ubuntu/setup.md).
