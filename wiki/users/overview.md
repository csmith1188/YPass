# User guide

## Installation (application operators)

1. Copy `.env.example` to `.env`.
2. Run `npm install`, `npm run db:init`, and `npm run dev`.
3. Open the `APP_BASE_URL` in a browser.

## Login methods

The application can enable any combination of:

- Local username, email, and password
- Formbar OAuth
- Microsoft Entra

Your operator decides which methods appear on the sign-in page.

## Account management

Signed-in users can open **Account** to:

- See linked sign-in methods
- Link Formbar or Microsoft (when enabled)
- Unlink a method after confirming they still have another way to sign in
- Change a local password

Unlinking the last sign-in method is blocked.

## Common behavior

Sessions expire after idle time and after an absolute maximum lifetime. Signing out clears the server session.
