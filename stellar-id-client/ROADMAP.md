# Roadmap — client

Where the TypeScript SDK stands and what comes next. No dates are promised; this file is updated as items land.
Status: **testnet only, v0.x.**

## Done (0.1.0, on npm)

- [`stellar-id-client@0.1.0`](https://www.npmjs.com/package/stellar-id-client): create, resolve, update and deactivate
  DIDs; issue, verify and revoke credentials; challenge sign-in; `KeypairSigner` and `WalletsKitSigner`; typed errors;
  ESM + CJS builds.
- Exercised end to end on testnet by the integration test, the Node quick start (re-run against the npm package on
  2026-11-09) and the [hosted demo](https://stellar-ids.github.io/frontend/).

## Open for contributors (Wave)

| Issue | Points | What it delivers |
|---|---|---|
| [#1 TypeScript types for new DID methods](https://github.com/Stellar-IDs/client/issues/1) | 3 | Types for method variants registered through core #1 |
| [#2 Wallet connector integration](https://github.com/Stellar-IDs/client/issues/2) | 3 | Real-wallet testing (Freighter and others), capability detection, auth-entry signing |
| [#3 Resolver fallback](https://github.com/Stellar-IDs/client/issues/3) | 2 | Multi-RPC failover, optional cache, archived-entry restore |
| [#4 Comprehensive documentation](https://github.com/Stellar-IDs/client/issues/4) | 2 | TypeDoc site, cookbook, error reference |

Issues #1–#3 have a `TODO(wave: client-N)` marker at their plug-in point in the code; #4 builds on the README and
the JSDoc comments.

## Maintainer track

- Keep the vendored contract bindings in step with each contract redeploy (testnet resets wipe contracts).
- Release tooling: Changesets for versions and changelogs, npm provenance on publish.
- A controller-rotation wrapper once the contract interface is frozen (rotation is contract-only today).

## Not planned for v1

Mainnet support, a hosted resolver service, and session storage (sessions are the application's job).
