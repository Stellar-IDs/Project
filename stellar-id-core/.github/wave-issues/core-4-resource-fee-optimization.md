**Title:** Resource-fee optimization: cut ledger reads, writes and bytes

## Summary
Storage is deliberately straightforward. Reduce resource fees for the main
calls and show the improvement against the measured baseline.

## Background
- `docs/COSTS.md`: fees per call measured on testnet (baseline).
- `contracts/identity/src/storage.rs` (search `TODO(wave: core-4)`).
- `create_did` and `anchor_credential` are dominated by rent for new entries.

## Scope
- [ ] Profile the main calls and pick the biggest wins (record layout, key size, TTL policy, avoiding redundant writes)
- [ ] Implement the changes without breaking the public interface
- [ ] Re-measure on testnet with `stellar contract invoke --cost` and update `docs/COSTS.md` with before/after

## Out of scope
- Changing public function signatures

## Acceptance criteria
- [ ] All existing tests pass unchanged
- [ ] `docs/COSTS.md` shows before/after numbers for each optimized call
- [ ] Verify command passes

## How to test locally
```bash
cargo test
stellar contract build
```

**Points:** 2 · **Labels:** wave, area:contract, performance
