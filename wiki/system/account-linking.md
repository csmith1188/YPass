# Account linking

Linking requires an authenticated session and a completed provider callback bound to a one-time nonce. Email matching is not a linking signal.

Unlink requires reauthentication (local password when present) and is blocked when it would leave zero usable methods.

Link and unlink events are written to `audit_events`.
