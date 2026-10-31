**Title:** Full-stack example: frontend + backend + contract

## Summary
Only a Node example exists. Build a complete example: a React frontend, a
backend that verifies sign-in challenges server-side and issues a session,
and credential issuance/verification against the testnet contract.

## Background
- `verifyChallengeResponse` with a persistent nonce store must run on the
  server; `withAuth` is client-side UX only.
- `docs/security/basics.md` (replay protection, nonce persistence).
- `stellar-id-client` `examples/node-basic` and the frontend `demo/`.

## Scope
- [ ] Example repo or folder with frontend, backend (e.g. Node/Express) and setup docs
- [ ] Server-side challenge verification with persistent nonces and session cookies
- [ ] Issue / verify / revoke a credential end to end
- [ ] A docs page walking through it

## Acceptance criteria
- [ ] Runs from a clean checkout following the README
- [ ] `pnpm build` passes with broken-link checking

**Points:** 4 · **Labels:** wave, documentation, example
