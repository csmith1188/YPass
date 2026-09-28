# Database

`DATABASE_PROVIDER=postgres` (production) or `sqlite` (dev/test/single-node). Business logic uses the Knex adapter in `src/database`. SQLite is executed with sql.js (WASM) so developers do not need native C++ build tools; PostgreSQL still uses `pg` with pooling.

SQLite plus `WEB_CONCURRENCY>1` is rejected at startup. PostgreSQL outages do not fail over to SQLite.

Use `app_migrator` for DDL and `app_runtime` for DML. Run `npm run db:migrate` as a one-shot process before PM2 start. Do not auto-migrate every worker.

TLS: `DATABASE_SSL=require` for remote Postgres.
