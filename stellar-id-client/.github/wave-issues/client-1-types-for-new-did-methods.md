**Title:** TypeScript types for newly registered DID methods

## Summary
`ParsedDid` hard-codes `method: "stellar"` and the networks `testnet | public`.
Once the contract supports method registration (`stellar-id-core` core-1),
extend the types and parser so new methods and networks are first-class,
keeping `method` as the discriminant.

## Background
- `src/did.ts`: `DidNetwork`, `ParsedDid`, `parseDid`, `formatDid` (search `TODO(wave: client-1)`).
- `src/w3c.ts`: DID document mapping.
- Depends on core-1. Coordinate the registry shape with that issue.

## Scope
- [ ] Discriminated union over registered methods
- [ ] Parser/formatter support with typed `DidParseError` failures
- [ ] Regenerate bindings if the contract interface changes

## Out of scope
- Contract changes

## Acceptance criteria
- [ ] Happy- and failure-path tests for each new parse case
- [ ] `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes
- [ ] No `any`; JSDoc on every new export

## How to test locally
```bash
pnpm test
```

**Points:** 3 · **Labels:** wave, area:sdk
