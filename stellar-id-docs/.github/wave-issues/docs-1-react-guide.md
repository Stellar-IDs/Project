**Title:** Full React integration guide

## Summary
The React quick start is deliberately minimal. Write a full guide: providers,
hooks, protected routes, DID registration before sign-in, and error handling.

## Background
- `docs/quickstart/react.md` (current minimal quick start).
- `stellar-id-frontend` README and its `demo/` app (working reference flow).
- Sign-in requires an existing on-chain DID.

## Scope
- [ ] Guide page(s): setup, `SessionProvider`, `IdentityLogin`, hooks, `withAuth` caveats, server-side session checks
- [ ] Error-handling section mapping each SDK error to UI
- [ ] Every code sample run against testnet or type-checked

## Acceptance criteria
- [ ] `pnpm build` passes with broken-link checking
- [ ] Someone new to the project follows the guide to a working sign-in

**Points:** 3 · **Labels:** wave, documentation
