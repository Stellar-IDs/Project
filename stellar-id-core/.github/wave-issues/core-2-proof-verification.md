**Title:** Credential proof verification: support more proof types

## Summary
`verify_credential_proof` only handles Ed25519. Add a proof-type enum and
dispatch on `VerificationMethod.kind`, with at least one extra type (e.g.
secp256r1 / passkey) and conformance tests.

## Background
- `contracts/identity/src/lib.rs`: `verify_credential_proof` (search `TODO(wave: core-2)`).
- `VerificationMethod.kind` is a `Symbol`; only `Ed25519` is accepted today by
  `create_did` and `add_verification_method`.
- `docs/test-vectors.json` holds the Ed25519 vectors; METHOD_SPEC §6 covers hashing.
- Note: `ed25519_verify` traps on a bad signature (documented behaviour).

## Scope
- [ ] Proof-type enum and dispatch in `verify_credential_proof`
- [ ] Accept the new key kind in `create_did` / `add_verification_method`
- [ ] At least one new proof type with test vectors added to `docs/test-vectors.json`
- [ ] Conformance tests: valid, invalid signature, wrong key, wrong kind

## Out of scope
- BBS+ / selective disclosure
- Client SDK changes (follow-up issue)

## Acceptance criteria
- [ ] Ed25519 behaviour unchanged (existing tests still pass)
- [ ] Verify command passes
- [ ] METHOD_SPEC updated

## Hints
Check the current `soroban-sdk` 28 crypto API before choosing primitives (e.g.
secp256r1 support); don't assume an API exists.

## How to test locally
```bash
cargo test
```

**Points:** 3 · **Labels:** wave, area:contract, area:crypto
