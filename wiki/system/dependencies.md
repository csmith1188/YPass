# Dependency updates

- `npm audit` in CI (`npm run audit`)
- `npm outdated` manually
- Do not bump major versions in production without running `npm test` and a staging deploy
- Prefer maintained packages; replace deprecated ones instead of pinning forever
- License review is the operator's responsibility when adding packages
