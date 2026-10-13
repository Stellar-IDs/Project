# Contributing to stellar-id-core

Thanks for your interest! This package is part of the Stellar Identity & Authentication Suite monorepo.

## Setup

1. Install Rust (stable), the `wasm32-unknown-unknown` target, and the Stellar CLI (see `PLAYBOOK.md` §6 in the monorepo root).
2. Generate a testnet identity: `stellar keys generate deployer --network testnet --fund`

## Verify (run before every commit)

```bash
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build
```

## Conventions

- Conventional Commits with the package scope: `feat(core): add update_did`
- One package per commit
- `#![no_std]` — no `std` types; use `soroban_sdk::{String, Vec, Map, Bytes, BytesN, Symbol, Address}`
- No `unwrap()` / `expect()` in contract code — return `Result<_, Error>` with the `#[contracterror]` enum
- Explicit storage key enum (`DataKey`); TTL extension on every persistent write
- Events for every state change; bounded collection sizes (max 10 verification methods, max 10 services)
- No PII on-chain — keys, hashes, status flags, and service endpoints only
- Testnet only. Never target mainnet. Never commit secrets.

## Issues

- Bug reports and feature requests: use the templates in `.github/ISSUE_TEMPLATE`.
- Wave contributor tasks use `wave-task.md` and the MVP boundary defined in `PLAYBOOK.md` §12: build the plug-in point the issue hooks into, not the issue itself.
