# Testing

Vitest projects:

- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `tests/security`

Load tests are a separate CLI (`npm run loadtest`) and k6 script under `tools/loadtest`. They refuse non-allowlisted hosts.

External systems are mocked. SQLite is the default test database.
