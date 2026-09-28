# Architecture

Layered Express application:

1. Routes bind URLs and middleware.
2. Controllers handle HTTP concerns.
3. Services contain business logic and never touch `req`/`res`.
4. Repositories isolate Knex.
5. Integrations isolate Formbar, Entra, email, Redis, and Seq.

`src/container.js` wires modules. Feature flags decide what is constructed. See [folder-structure.md](folder-structure.md) and [request-lifecycle.md](request-lifecycle.md).
