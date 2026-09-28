# Logging

Pino JSON logs on stdout (PM2-friendly). Optional rotating files via `LOG_FILE_ENABLED`. Optional Seq via `SEQ_ENABLED`; Seq failures never crash the process.

Redaction covers passwords, tokens, cookies, API keys, and secrets.

Audit events use `channel: audit` and the `audit_events` table for login, logout, password, linking, and admin actions.
