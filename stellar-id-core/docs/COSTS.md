# Costs

Measured on **testnet** on 2026-10-31 against contract
`CAFPRFXKOSHELQAB7TRMLEUEYIVYRJIKSZIZ6UU5WXB5DDEUMCBHGAWV` (wasm hash
`5cc2f2b5…49a7`, 21329 bytes) with `stellar contract invoke --cost`
(stellar CLI 28.1.0). One run per call, small inputs (1–2 verification
methods, 1 service). Fees are in stroops (1 XLM = 10,000,000 stroops) and
depend on network fee settings at the time — treat them as a baseline, not
a guarantee.

| Call | Fee charged | Resource fee | Non-refundable | Refundable charged | Notes |
|---|---:|---:|---:|---:|---|
| `create_did` | 1,273,761 | 1,273,661 | 5,292 | 1,268,369 | New persistent entry; rent for ~30 days dominates |
| `add_verification_method` | 271,517 | 271,417 | 4,320 | 267,097 | Record grows → rent on the new bytes |
| `add_service` | 254,814 | 254,714 | 4,284 | 250,430 | |
| `set_relationships` | 37,992 | 37,892 | 4,128 | 33,764 | |
| `anchor_credential` | 789,337 | 789,237 | 4,124 | 785,113 | New persistent entry |
| `revoke_credential` | 4,447 | 4,347 | 3,839 | 508 | In-place flag flip |
| `deactivate_did` | 4,259 | 4,159 | 3,778 | 381 | In-place flag flip |

Read-only calls (`resolve`, `credential_status`, `verify_credential_proof`)
are free when simulated. `bump_ttl` was only simulated: the CLI did not
submit it, because its default send policy doesn't count a TTL extension as
a reason to send. It needs `--send=yes` to actually extend TTL, and its fee
was not measured.

Takeaway: the cost of creating new entries (`create_did`,
`anchor_credential`) is dominated by storage rent. Updates that grow the
record cost about 0.03 XLM; flag flips cost well under 0.001 XLM.

Structural facts:

| Item | Value |
|---|---|
| Persistent entries per DID | 1 (`DataKey::Did(controller)`) |
| Persistent entries per credential | 1 (`DataKey::Credential(issuer, hash)`) |
| TTL policy | Extend to ~30 days when below ~2 days on every write; `bump_ttl` for DIDs |
| Per-DID caps | 10 verification methods, 10 services, relationship lists ≤ 10 |

Reproduce: deploy, then run each call with `stellar contract invoke --id
<id> --source-account <identity> --network testnet --cost -- <fn> ...`.
