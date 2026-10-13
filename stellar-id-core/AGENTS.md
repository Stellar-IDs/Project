# AGENTS.md — stellar-id-core

This package is part of the Stellar Identity & Authentication Suite monorepo. The authoritative agent rules live at the monorepo root: read `../AGENTS.md` first, then `../STATUS.md`, then the current phase in `../PLAYBOOK.md`.

## Package specifics

- Rust + Soroban contract. Conventions: `#![no_std]`, no `unwrap()`/`expect()` in contract code, explicit `DataKey` storage enum, TTL extension on every persistent write, events for every state change, bounded collections.
- Verify command: `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build`
- Commits: Conventional Commits with the `core` scope, one package per commit.
- soroban-sdk is pinned to 28.0.0 to match stellar CLI 28.1.0 — do not bump the SDK past the CLI major without a decision note in `../STATUS.md`.
