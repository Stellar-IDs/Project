**Title:** DID method registration: register method variants, networks and versions

## Summary
The contract assumes one method (`stellar`) on one network. Add a registry
so more method variants, networks or versions can be registered with
metadata and governance rules.

## Background
- `contracts/identity/src/lib.rs`: `create_did` (search `TODO(wave: core-1)`).
- `docs/METHOD_SPEC.md` §12 (name conflict and rename contingency) and the extension table.
- Today the method name and network are implicit; records are keyed only by `Address`.

## Scope
- [ ] Storage for registered methods/networks with metadata, using an explicit `DataKey` variant and TTL extension
- [ ] An admin/governance model for who can register (document the trust assumptions)
- [ ] `create_did` validates against the registry; existing DIDs keep working
- [ ] Events for registry changes
- [ ] METHOD_SPEC updated with the extension design

## Out of scope
- Client-side types (that's `stellar-id-client` client-1)
- Mainnet deployment

## Acceptance criteria
- [ ] Happy-path and failure-path tests for every new function (`cargo test`)
- [ ] `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build` passes
- [ ] No breaking change to existing public functions (or a documented, approved one)

## Hints
Follow the existing patterns: `#[contracterror]` errors, `require_auth` before
state changes, bounded collections. Error variants need doc comments starting
with the variant name (clients map errors by it).

## How to test locally
```bash
cargo test
stellar contract build
```

**Points:** 4 · **Labels:** wave, area:contract
