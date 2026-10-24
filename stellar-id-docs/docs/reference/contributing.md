---
id: contributing
title: Contributing
sidebar_label: Contributing
sidebar_position: 1
---

# Contributing

Thanks for considering a contribution! The suite is a monorepo of four
packages that are later split into separate repos.

## Monorepo Structure

```
stellar-identity-suite/
├── stellar-id-core/        # Soroban contract (Rust)
├── stellar-id-client/      # TypeScript SDK
├── stellar-id-frontend/    # React components + hooks
├── stellar-id-docs/        # This site (Docusaurus)
├── scripts/                # verify-all.sh, sync-bindings.sh
└── pnpm-workspace.yaml
```

## Local Setup

```bash
# Core (Rust)
cd stellar-id-core
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
stellar contract build

# Client / Frontend / Docs (Node)
cd ../stellar-id-client  # or frontend, docs
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

**All packages must pass their verify commands before PRs.**

## Commit Convention

One package per commit, Conventional Commits with package scope:

```
feat(core): add rotate_controller
fix(client): handle archived entry in resolver
docs(docs): add react quickstart
```

## Branching & PRs

- Trunk-based on `main`; short-lived branches are fine.
- PRs must pass CI (all package verify commands + link check for docs).
- No `workspace:*` or `file:` dependencies — use semver ranges.

## Testing

| Layer | Tool | Scope |
|---|---|---|
| Contract | `cargo test` | All functions, auth, limits, events |
| SDK | `vitest` | Unit (mocked RPC) + integration (`INTEGRATION=1`) |
| Frontend | `vitest` + `@testing-library/react` | Hooks, components, a11y (axe) |
| Docs | `docusaurus build` | Broken-link check, snippet validity |

## Code Style

- **Rust**: `#![no_std]`, no `unwrap()`/`expect()` in contract code,
  `Result<_, Error>` with `#[contracterror]`, explicit `DataKey` enum,
  TTL extension on every write, events for every state change.
- **TypeScript**: `strict: true`, no `any`, ESM + CJS dual build,
  JSDoc on every public export, typed error classes.
- **React**: Function components, accessible by default (labels, focus,
  ARIA only when needed), CSS variables, no hardcoded colors.
- **Tests**: Every public function has a happy-path and at least one
  failure-path test.

## Security

- No secrets in git, PRs, logs, or CI. Use testnet identities only.
- Report vulnerabilities via `SECURITY.md` in each package.

## License

Apache-2.0 across all packages.

---

**Thank you!** 🚀