# Ubuntu production setup

Firewall assumptions:

- Public: 80/443 only
- Node, PostgreSQL, and Redis bind to localhost, a private network, or the Docker bridge
- Do not expose `PORT` (default 3000) on `0.0.0.0` on the host

Choose **host Nginx + PM2** or **Docker**. Do not run both stacks against the same ports.

## Host Nginx + PM2

1. Install Node.js 22 LTS, PostgreSQL, Redis, Nginx, and PM2 (`npm i -g pm2`).
2. Create PostgreSQL roles `app_migrator` (DDL) and `app_runtime` (DML). Run migrations with migrator credentials, then start PM2 with runtime credentials.
3. Copy `.env.example` to a file owned by the service user. Set `NODE_ENV=production`, `DATABASE_PROVIDER=postgres`, `REDIS_ENABLED=true`, `TRUST_PROXY=1`, `HOST=127.0.0.1`.
4. `npm ci --omit=dev`
5. `node scripts/wait-for-deps.js && npm run db:migrate && npm run db:seed`
6. `pm2 start ecosystem.config.cjs --env production`
7. `pm2 save` and `pm2 startup systemd`
8. Install `deploy/nginx/formbar-app.conf`, enable the site, reload Nginx.

PM2 reload: `npm run pm2:reload`. `kill_timeout` must exceed the HTTP drain time.

Logs: PM2 captures stdout/stderr. Optional `LOG_FILE_ENABLED=true` writes rotating files under `logs/`.

## Docker (Compose)

Files: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.host.yml`, `deploy/docker/nginx.conf`.

Compose interpolates `POSTGRES_PASSWORD` and `REDIS_PASSWORD` from the project `.env`. URL-encode special characters in those values when they appear in `DATABASE_URL` / `REDIS_URL`. Postgres and Redis are not published on the host.

1. Install Docker Engine and the Compose plugin. Do not install Node/Postgres/Redis on the host unless you are mixing with the PM2 path above.
2. Copy `.env.example` to `.env`. Set production secrets plus:
   - `NODE_ENV=production`
   - `APP_BASE_URL=https://example.yorktechapps.com`
   - `POSTGRES_PASSWORD` (required)
   - `REDIS_PASSWORD` (required)
   - Formbar/Entra/session keys as for any production host
3. Edit `deploy/nginx/formbar-app.conf` (host Nginx) or `deploy/docker/nginx.conf` (in-compose Nginx): `server_name` and TLS paths.
4. Build and start app + Postgres + Redis. Migrations and seeds run once in the `migrate` service before `app` starts. Node listens inside the container on `0.0.0.0:3000` and is not published on the host unless you use `docker-compose.host.yml`.
5. Put TLS in front (host Nginx or in-compose Nginx). Do not also run the PM2 stack.

### Host Nginx (recommended, single app replica)

Reuse `deploy/nginx/formbar-app.conf` (upstream `127.0.0.1:3000`). Install certs on the host, enable the site, reload Nginx.

```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

Leave the Compose `nginx` service unused. Do not combine this file with `--scale app=N`.

### In-compose Nginx (also used when scaling)

Place `fullchain.pem` and `privkey.pem` in `deploy/docker/certs/` (or set `TLS_CERT_PATH` / `TLS_KEY_PATH` in `.env`). Then:

```bash
docker compose --profile edge up -d --build
```

Do not also bind a host Nginx to 80/443.

### Scale workers

Each app container is one Node process (`WEB_CONCURRENCY=1`). Redis is required. Scale only with in-compose Nginx (no host port mapping):

```bash
docker compose --profile edge up -d --scale app=2
```

Compose DNS round-robins `app`. Websocket-only Socket.IO does not need sticky sessions.

### Day-2

```bash
docker compose logs -f app
docker compose exec app node scripts/db-status.js
docker compose run --rm migrate
docker compose up -d --build --no-deps app
docker compose down
```

`docker compose down` keeps named volumes (`postgres_data`, `redis_data`). Add `-v` only when you intend to destroy the database.

Health: `GET /health/live` and `GET /health/ready` on loopback. Container `HEALTHCHECK` uses `/health/live`.
