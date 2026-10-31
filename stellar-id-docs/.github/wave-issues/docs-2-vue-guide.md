**Title:** Vue integration guide (SDK directly)

## Summary
There is no Vue support. Write a guide that uses `stellar-id-client` directly
from Vue 3: sign-in, profile display, credential status.

## Background
- `docs/quickstart/node.md` (SDK usage that is known to work).
- `stellar-id-client` exports: `createChallenge`, `challengeBytes`,
  `verifyChallengeResponse`, `resolveIdentity`, `verifyCredential`.

## Scope
- [ ] Guide page with a minimal Vue 3 app (composables for session and DID resolution)
- [ ] Browser concerns: `Buffer` polyfill, no secrets in browser code
- [ ] Samples tested in a real Vue project

## Acceptance criteria
- [ ] `pnpm build` passes with broken-link checking
- [ ] The sample app runs against testnet

**Points:** 3 · **Labels:** wave, documentation
