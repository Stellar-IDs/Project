# AGENTS.md — Stellar Identity & Authentication Suite

You are building a four-package identity suite on Stellar/Soroban inside ONE monorepo that will later be split into four repos. Read this file fully at the start of every session, then read `STATUS.md`, then the section of `PLAYBOOK.md` for the current phase. Do not skim.

## What exists

| Folder | Future repo | Language | Purpose |
|---|---|---|---|
| `stellar-id-core/` | stellar-id-core | Rust (Soroban) | `did:stellar` DID + credential-anchoring + revocation contract |
| `stellar-id-client/` | stellar-id-client | TypeScript | SDK: resolve, create, update, verify, sign-in challenges, wallet adapters |
| `stellar-id-frontend/` | stellar-id-frontend | React/Next.js | Components + hooks built on the client SDK |
| `stellar-id-docs/` | stellar-id-docs | Docusaurus (MDX) | Guides, API reference, examples |

Dependency direction (never reverse it): `core` → `client` → `frontend` → `docs`.

## Hard rules

1. **Split-ready always.** Every folder must build, test and lint on its own. No imports by relative path across folders (`../stellar-id-client/...` is forbidden). Cross-package use goes through a declared dependency (semver range in `package.json`) or generated bindings committed inside the consuming package.
2. **One package per commit.** Use Conventional Commits with the package as scope: `feat(core): add update_did`, `fix(client): handle archived entry`, `docs(docs): add react guide`. A commit that touches two folders must be split.
3. **Never touch secrets.** No secret keys, seed phrases, or API keys in files, logs, commits, or prompts. Use `stellar keys` identities (e.g. `deployer`) and `.env` files that are gitignored. Testnet only. Never target mainnet.
4. **Verify before claiming done.** Run the package's verify command (below) and paste the result summary. If anything fails, fix it or report it. Never say "should work".
5. **Do not invent APIs.** For `soroban-sdk`, `@stellar/stellar-sdk`, the Stellar CLI, wallets kit and OpenCode, check the current official docs or the installed package source before using an API. Versions drift and names change. If unsure, say so.
6. **No PII on-chain.** Only keys, hashes, status flags, and service endpoints go on-chain. Credential contents stay off-chain.
7. **Honest docs.** READMEs and docs describe only what is implemented and tested. No aspirational feature claims.
8. **Leave the Wave issues open.** `PLAYBOOK.md` §12 defines an MVP boundary for each planned contributor issue. Build up to the boundary, not past it. Add `// TODO(wave: core-1)` style markers where the issue will plug in.
9. **Small steps.** Plan first, then implement one task at a time. Commit after each green task.
10. **Stop and ask** before: adding a new dependency that is not in the playbook, changing a public contract function signature after Phase 1 sign-off, deleting files you did not create, or anything that touches git history.

## Verify commands

```bash
# core
cd stellar-id-core && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build

# client / frontend / docs (run from the package folder)
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Code conventions

- **Rust:** `#![no_std]`, no `unwrap()`/`expect()` in contract code (return `Result<_, Error>` with a `#[contracterror]` enum), explicit storage key enum (`DataKey`), TTL extension on every persistent write, events for every state change, bounded collection sizes.
- **TypeScript:** `strict: true`, no `any`, ESM + CJS dual build, every public function has JSDoc and a test, errors are typed classes (`StellarIdError` subclasses) not strings.
- **React:** function components, accessible by default (labels, focus order, keyboard, ARIA only when needed), styling via CSS variables, no hardcoded colors.
- **Tests:** every public function has a happy-path and at least one failure-path test.

## Session protocol

- **Start:** read `AGENTS.md`, `STATUS.md`, current phase in `PLAYBOOK.md`. State the task and acceptance criteria back in two lines.
- **During:** work task by task. Update `STATUS.md` after each completed task.
- **End:** run the verify command, update `STATUS.md` (done / in progress / next / blockers / decisions), and commit.
