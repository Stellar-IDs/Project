**Title:** Comprehensive SDK documentation: TypeDoc site, cookbook, error reference

## Summary
The SDK has JSDoc on every export, a README and one Node example. Add a
generated API reference, a cookbook of common tasks, and an error reference.

## Background
- `src/index.ts` (public surface), `src/errors.ts` (typed errors and codes).
- `examples/node-basic/run.mjs` (full lifecycle example).

## Scope
- [ ] TypeDoc (or equivalent) generation script and output config
- [ ] Cookbook: create DID, add key/service, issue/verify/revoke, sign-in server check
- [ ] Error reference: each `StellarIdError` subclass, its `code`, and when it's thrown

## Out of scope
- Hosting the docs (the `stellar-id-docs` repo owns the site)

## Acceptance criteria
- [ ] Docs build without warnings; every cookbook snippet is run or type-checked
- [ ] Verify command passes

**Points:** 2 · **Labels:** wave, area:sdk, documentation
