# Security review — stellar-id-core

Scope: `contracts/identity` at the commit that adds this file. Method: manual
review against the PLAYBOOK §8 Phase 7 checklist, with a regression test for
each fix. This is a self-review by the authors, **not an independent audit**.
The contract is testnet-only.

## Not yet done

| Item | Status |
|---|---|
| `cargo deny` | Not configured. (`cargo audit` was run; see below.) |
| Soroban Guard static analysis | Not run. |
| Fresh-session adversarial pass | Not run; this review was done in the same session that read the code. |
| Fuzz / property tests | None. |
| Independent audit | None. |

## Findings

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| F-1 | Low | `create_did` did not bound service `kind` length (`add_service` did), so a DID could be created with an arbitrarily large `kind` string. | **Fixed.** `validate_new_doc` rejects `kind` > 128 bytes (`InvalidInput`). Test: `create_did_oversize_service_kind_fails`. |
| F-2 | Medium | Credentials are keyed by `(issuer address, hash)`, not by DID. After `rotate_controller`, the old address no longer resolves, but its credentials stay `Active`; if anyone with that key calls `create_did` again, those credentials appear under the new document with different keys. | **Accepted, documented.** Changing it needs a public-interface change (frozen after Gate 1b). Mitigation for issuers: revoke or re-anchor before rotating. The old key can still revoke. Behavior pinned by `rotate_then_recreate_old_address_inherits_old_credentials`. Candidate for a post-Gate-1b design decision. |
| F-3 | Medium | `authentication` / `assertion_method` lists were not length-bounded: a caller could submit one valid id repeated many times, growing the stored record without limit (caller-paid, but unbounded storage and iteration cost for every reader). | **Fixed.** Both lists capped at `MAX_VERIFICATION_METHODS` (`create_did` → `InvalidInput`, `set_relationships` → `LimitExceeded`). Test: `relationship_lists_are_bounded`. |
| F-4 | Low | No function extends a credential record's TTL (`bump_ttl` covers DIDs only). An un-rewritten credential entry can be archived after ~30 days of inactivity; the client must restore it before reading. | **Open / documented.** Adding `bump_credential_ttl` is a new public function; deferred to the Gate 1b decision. |
| F-5 | Info | `verify_credential_proof` verifies a signature over the raw 32-byte credential hash with no domain-separation prefix. A signature is bound to the key and hash, not to a purpose. | **Accepted.** Hash input is the JCS credential, which includes issuer and subject ids. Sign-in challenges must use a distinct prefixed message (client SDK concern; verify there). |
| F-6 | Info | `anchor_credential` accepts an `expires_at` already in the past (credential is immediately `Expired`). | **Accepted.** Harmless. |
| F-7 | Info | Doc comment for `credential_status` was attached to `verify_credential_proof`. | **Fixed.** |
| F-8 | Medium (availability) | `ContractError` variants had no doc comments. stellar-sdk clients build `Err({ message })` from those docs, so every contract error reached clients as an empty message: a missing DID could not be told apart from any other failure, and the demo's sign-in for new wallets failed with an opaque error. Found by the demo e2e. | **Fixed.** Each variant is now documented, starting with its name. Verified live: resolving an unregistered address raises `DidNotFoundError` (client integration test). |

## Checklist (PLAYBOOK §8 Phase 7)

| Check | Result |
|---|---|
| Every mutating function calls `require_auth()` before state changes | Yes — all 10 mutating functions; each group has a no-auth failure test. `bump_ttl` is intentionally unauthenticated (no state change, caller pays). |
| No caller can mutate another's DID | Records are keyed by the authorizing address; `controller != record.controller` checks are defense-in-depth. |
| Rotation needs both controllers | Yes — `controller` and `new_controller` both `require_auth`. |
| Deactivated DIDs can't be mutated/issue/verify | Yes for mutation, anchoring and proof verification. `revoke_credential` deliberately still works (wind-down). |
| Size limits | Enforced on ids, kinds, endpoints, method/service counts and (since F-3) relationship lists. |
| No unbounded loops over user data | All loops are bounded by the caps above. |
| TTL/archival | DID and credential writes extend TTL; `bump_ttl` works for DIDs; credential gap is F-4. |
| Checked arithmetic | `overflow-checks = true` in the release profile; the only arithmetic is `version += 1` on a `u32`. |
| Replay / domain separation | See F-5. |
| Events leak nothing sensitive | Events carry addresses, hashes and version numbers only. |

## Deployment note

Redeployed to testnet on 2026-10-31 with the F-1/F-3 fixes
(`CAFPRFXK…GAWV`). F-3 was confirmed live: an 11-entry `authentication`
list fails simulation with `Error(Contract, #9)` (`LimitExceeded`). The
same day it was redeployed again as
`CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT` after F-8.
Earlier deployments are superseded (see `deployments/testnet.json`).

## Dependency audit (2026-10-31)

`cargo audit` (advisory DB of that date, 215 crates): **RUSTSEC-2026-0387**
(`crypto-bigint` 0.5.5, timing variability). It reaches this crate only via
`soroban-env-host` → `k256`/`p256`, the host used by tests; `cargo tree
--target wasm32v1-none` shows it is not in the contract wasm. **Accepted**
until soroban-sdk ships a host on the patched line. `paste` is flagged as
unmaintained (warning only, proc-macro, build-time).
