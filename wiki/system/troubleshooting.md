# Troubleshooting

- Config error on boot: read the aggregated `Invalid configuration` list.
- Ready 503: database or required Redis is down. Seq/email failures should not do this.
- Formbar login loops: confirm `FORMBAR_REDIRECT_URI` matches the Formbar app registration exactly.
- Formbar `The requested endpoint, /api/v1/oauth/authorize…, does not exist`: you hit Formbar's API, not the login page. Set `FORMBAR_OAUTH_MODE=legacy_redirect` and restart. That mode uses `/oauth?redirectURL=`.
- CSRF errors: the page must be loaded over the same site so the CSRF cookie is sent.
- SQLite cluster error: set `WEB_CONCURRENCY=1` or switch to PostgreSQL.
- Native module build errors on Windows: install the Visual Studio C++ build tools, or use WSL/Ubuntu for parity with production.
