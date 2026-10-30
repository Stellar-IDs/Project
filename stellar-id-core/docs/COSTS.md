# Costs

Resource-fee measurements (CPU instructions, memory, ledger reads/writes,
fee per call) have **not been collected yet**. PLAYBOOK §8 Phase 7 calls for
simulating the key calls on testnet and recording them here; until that is
done, no per-call figures are claimed.

What is known:

| Item | Value |
|---|---|
| Contract wasm size (`stellar contract build`) | 21329 bytes |
| Persistent entries per DID | 1 (`DataKey::Did(controller)`) |
| Persistent entries per credential | 1 (`DataKey::Credential(issuer, hash)`) |
| TTL policy | Extend to ~30 days when below ~2 days on every write; `bump_ttl` for DIDs |
| Per-DID caps | 10 verification methods, 10 services, relationship lists ≤ 10 |

To collect numbers: deploy to testnet, then run
`stellar contract invoke ... --send=no` (simulation) for each function and
record the reported resources.
