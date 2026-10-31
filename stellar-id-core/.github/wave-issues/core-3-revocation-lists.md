**Title:** Revocation list support: batched status lists

## Summary
Revocation is per credential today (one storage entry each). Add a batched
revocation list (status-list / bitstring style) with efficient index lookups,
keeping the `credential_status` public signature stable.

## Background
- `contracts/identity/src/lib.rs`: `credential_status`, `revoke_credential` (search `TODO(wave: core-3)`).
- `contracts/identity/src/types.rs`: `CredentialStatus`, `CredentialRecord` (also marked).
- Status precedence today: Unknown, then Revoked over Expired over Active.

## Scope
- [ ] Storage design for a bitstring/status list per issuer (bounded size, TTL extension)
- [ ] Functions to create a list and set/clear an index, with `require_auth` on the issuer
- [ ] `credential_status` consults the list without changing its signature
- [ ] Events for list changes

## Out of scope
- W3C StatusList2021 credential serialization in the SDK (client follow-up)

## Acceptance criteria
- [ ] Tests for set/clear, out-of-range index, unauthorized issuer, and precedence with expiry
- [ ] Fees for the new calls measured and added to `docs/COSTS.md`
- [ ] Verify command passes

## Hints
Look at `storage.rs` for the TTL pattern; `docs/COSTS.md` shows a new
persistent entry costs much more than an update.

## How to test locally
```bash
cargo test
```

**Points:** 3 · **Labels:** wave, area:contract
