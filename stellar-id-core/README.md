# stellar-id-core

Soroban smart contract implementing the `did:stellar` DID method: DID
documents keyed by Stellar address, plus credential-hash anchoring and
revocation. Part of the Stellar Identity & Authentication Suite.

**Status:** testnet only, v0.x, unaudited (self-review only, see
[`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md)). Deployed to testnet
as `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT` (see
[`deployments/testnet.json`](deployments/testnet.json)). The method name
`did:stellar` conflicts with an existing method; see `docs/METHOD_SPEC.md` §12.

## 30-second example (Stellar CLI, testnet)

```bash
stellar keys generate me --network testnet --fund
ID=CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT
ME=$(stellar keys address me)

stellar contract invoke --id $ID --source-account me --network testnet -- \
  create_did --controller $ME \
  --doc "{\"controller\":\"$ME\",\"verification_methods\":[],\"authentication\":[],\"assertion_method\":[],\"services\":[]}"

stellar contract invoke --id $ID --source-account me --network testnet --send=no -- \
  resolve --controller $ME
```

Most apps should use the TypeScript SDK (`stellar-id-client`) instead.

## What's implemented

- DIDs: `create_did`, `resolve`, `add/remove_verification_method` (Ed25519),
  `set_relationships`, `add/remove_service` (https endpoints), `deactivate_did`,
  `rotate_controller` (both controllers sign), `bump_ttl`.
- Credentials: `anchor_credential` (SHA-256 hash + optional expiry, no
  contents on-chain), `revoke_credential`, `credential_status`,
  `verify_credential_proof` (Ed25519; traps on a bad signature).
- Limits: 10 verification methods, 10 services, relationship lists ≤ 10,
  ids/kinds ≤ 128 bytes, endpoints ≤ 512 bytes. Events on every state change;
  TTL extended on every write.
- 59 unit tests; fees measured on testnet in [`docs/COSTS.md`](docs/COSTS.md).

**Not yet:** other key types (secp256r1/passkeys), revocation lists, a TTL
bump for credential records, method registration, an independent audit,
mainnet. Credentials anchored before a controller rotation stay keyed by the
old address (SECURITY_REVIEW F-2).

## Documentation

- [`docs/METHOD_SPEC.md`](docs/METHOD_SPEC.md): the `did:stellar` method spec
- [`docs/test-vectors.json`](docs/test-vectors.json): JCS / SHA-256 / Ed25519 vectors
- [`CHANGELOG.md`](CHANGELOG.md)

## Development

```bash
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build
```

Needs Rust stable with the `wasm32v1-none` target and stellar CLI 28.x
(`soroban-sdk` 28.0.0).

## Contributing · Security · License

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · Apache-2.0 ([LICENSE](LICENSE))
