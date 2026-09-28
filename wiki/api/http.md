# HTTP API

Base path: `/api/v1`. Health probes are **not** under `/api`; they live at `/health/live` and `/health/ready`.

## Authentication

The v1 API uses the same server-side session cookie as the browser app. Mutating browser requests also require the CSRF token (`_csrf` body field or `x-csrf-token` header). This application does not issue its own access/refresh tokens in v1.

## Authorization

Role and permission checks run on the server. Clients cannot send a user id, role, or permission to elevate access.

## Status codes

- 200 success
- 400 validation
- 401 unauthenticated
- 403 forbidden or CSRF
- 404 not found
- 409 conflict
- 429 rate limited
- 500 unexpected
- 502 external service (generic public message)
- 503 not ready

## Example

`GET /api/v1/me` returns the current user. See [docs/openapi/v1.yaml](../../docs/openapi/v1.yaml) and, when `API_DOCS_ENABLED=true`, `/api/v1/docs`.
