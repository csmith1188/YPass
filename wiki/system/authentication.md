# Authentication architecture

A canonical `users` row can have one or more `auth_identities` (`local`, `formbar`, `entra`). Local passwords live in `local_credentials`. Provider refresh tokens, if persisted, are encrypted in `provider_tokens`.

Formbar login against current production uses `FORMBAR_OAUTH_MODE=legacy_redirect` (`/oauth?redirectURL=` and a cert-verified `?token=` JWT). `authorization_code` sends the browser to the Formbar.ts-client page `/oauth/authorize`, not `/api/v1/oauth/authorize`. The Jukebar query-string JWT is only used in legacy_redirect mode.

Entra uses MSAL Node. Tokens are not sent to the browser.

This app's session is independent of Formbar/Entra refresh tokens. Session cookies are HttpOnly, Secure in production, SameSite=Lax, with idle and absolute timeouts. Sessions regenerate after login and privilege changes.
