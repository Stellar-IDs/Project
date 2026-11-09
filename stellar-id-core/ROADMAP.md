# Roadmap — core

Where the `did:stellar` registry contract stands and what comes next. No dates are promised; this file is
updated as items land. Status: **testnet only, v0.x, unaudited.**

## Done (v0.1.x, testnet)

- DID lifecycle, credential anchoring, revocation and Ed25519 proof checks: 14 public functions, 59 tests.
- Deployed to testnet as `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`
  ([`deployments/testnet.json`](deployments/testnet.json)), used live by the
  [client SDK](https://github.com/Stellar-IDs/client) and the [hosted demo](https://stellar-ids.github.io/frontend/).
- Self-review with a regression test per fix ([`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md)); fees measured
  per call on testnet ([`docs/COSTS.md`](docs/COSTS.md)).

## Open for contributors (Wave)

| Issue | Points | What it delivers |
|---|---|---|
| [#1 DID method registration](https://github.com/Stellar-IDs/core/issues/1) | 4 | Register method variants, networks and versions with metadata |
| [#2 Revocation list support](https://github.com/Stellar-IDs/core/issues/2) | 3 | Batched status lists behind the existing `credential_status` signature |
| [#3 Credential proof verification](https://github.com/Stellar-IDs/core/issues/3) | 3 | More proof types (for example secp256r1 / passkeys) with conformance tests |
| [#4 Resource-fee optimization](https://github.com/Stellar-IDs/core/issues/4) | 2 | Fewer ledger reads, writes and bytes, benchmarked against `docs/COSTS.md` |

Each issue has a `TODO(wave: core-N)` marker at its plug-in point in the code.

## Maintainer track

- **Interface review and freeze.** Open review items: `create_did` returns `InvalidInput` where the `add_*`
  functions return `LimitExceeded` for the same caps; `rotate_controller` moves the record, so credentials anchored
  under the old address are orphaned; revocation stays allowed after deactivation; credentials survive controller
  rotation (F-2) and have no TTL bump of their own (F-4). Once these are settled, the interface is recorded as frozen.
- **More assurance:** `cargo deny`, fuzz/property tests on the validation paths, and a fresh adversarial review.
- **An independent audit** before any discussion of mainnet.

## Not planned for v1

Mainnet deployment, zero-knowledge or selective-disclosure credentials, and credential contents on-chain (only
hashes and status flags go on-chain).
