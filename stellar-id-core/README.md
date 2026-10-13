# stellar-id-core

Soroban smart contract implementing the `did:stellar` DID method for the Stellar Identity & Authentication Suite.

**Status:** Phase 0 scaffold — testnet only, v0.x. The contract currently exposes a single placeholder function (`contract_version`). The DID lifecycle (create / resolve / update / deactivate), verification methods, services, credential anchoring, and revocation are implemented in Phases 1–2 (see `PLAYBOOK.md` §8 in the monorepo root).

## What's implemented

- Cargo workspace (`contracts/identity`) on `soroban-sdk` 28.0.0 (matches stellar CLI 28.1.0)
- Release profile tuned for contract size (`opt-level = "z"`, `lto`, `panic = "abort"`, `overflow-checks`, `strip`)
- Placeholder `contract_version()` entry point so the package builds, tests, and deploys end-to-end
- Testnet deployment record template (`deployments/testnet.json`, empty until Phase 3)

## Development

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
stellar contract build
```

Full monorepo verification: `scripts/verify-all.sh` (from the repo root, Git Bash on Windows).

## Documentation

- `PLAYBOOK.md` §2.1 (DID method design) and §3 (contract interface), in the monorepo root
- `docs/METHOD_SPEC.md` — the `did:stellar` method spec (Phase 1 deliverable)

## Contributing

See `CONTRIBUTING.md`. Issue and PR templates live in `.github/`.

## Security

See `SECURITY.md`. Testnet only; no mainnet deployment in v1.

## License

Apache-2.0. See `LICENSE`.
