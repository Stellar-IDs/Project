**Title:** Social / passkey login fallback

## Summary
`SessionProvider` only gets signers from wallets (`createSigner`). Add a
provider for social- or passkey-backed login, with a clearly documented
custody and security model.

## Background
- `src/session/SessionProvider.tsx`: `SessionConfig.createSigner` (search `TODO(wave: frontend-1)`).
- Sign-in verifies against the on-chain DID's `authentication` keys
  (`verifyChallengeResponse` in `stellar-id-client`), so the new provider's key
  must be registered in the user's DID.

## Scope
- [ ] A signer source for passkey or social login, behind the existing `Signer` interface or a small provider abstraction
- [ ] Written custody/security model: who holds keys, recovery, threat model
- [ ] Wire it into `IdentityLogin` without breaking wallet login

## Out of scope
- Server-side session issuance

## Acceptance criteria
- [ ] Unit tests with mocks for success and failure paths, including axe checks for new UI
- [ ] `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes
- [ ] Security model doc reviewed by a maintainer

**Points:** 3 · **Labels:** wave, area:react, security
