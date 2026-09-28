# Folder structure

- `src/` application source
- `src/config` environment and feature flags
- `src/routes` HTTP routing only
- `src/controllers` request/response
- `src/services` use cases
- `src/repositories` persistence
- `src/auth` and `src/authorization` identity and RBAC
- `src/integrations` Formbar, Entra, email, Redis
- `src/database` Knex adapter and migrations
- `src/realtime` this app's Socket.IO server
- `src/logging` Pino, Seq, files
- `views/` EJS templates
- `public/` static assets
- `scripts/` database and ops CLIs
- `tests/` Vitest suites
- `tools/loadtest` load CLI (not an HTTP route)
- `wiki/` documentation
- `deploy/` Nginx and Ubuntu notes
