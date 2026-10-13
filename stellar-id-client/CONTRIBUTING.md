# Contributing to stellar-id-client

Thanks for your interest! This package is part of the Stellar Identity & Authentication Suite monorepo.

## Setup

1. Install Node.js 20+ and pnpm 12 (see `PLAYBOOK.md` §6 in the monorepo root).
2. `pnpm install --frozen-lockfile`

## Verify (run before every commit)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Conventions

- Conventional Commits with the package scope: `feat(client): handle archived entry`
- One package per commit
- TypeScript `strict: true`, no `any`, ESM + CJS dual build
- Every public function has JSDoc and a test (happy path + at least one failure path)
- Errors are typed classes (`StellarIdError` subclasses), never strings — the class hierarchy is a Phase 4 deliverable
- No path imports across packages; cross-package code goes through the declared dependency or generated bindings under `src/generated/` (Phase 3)
- Testnet only. Never commit secrets, seed phrases, or API keys.

## Issues

- Bug reports and feature requests: use the templates in `.github/ISSUE_TEMPLATE`.
- Wave contributor tasks use `wave-task.md` and the MVP boundary defined in `PLAYBOOK.md` §12: build the plug-in point the issue hooks into, not the issue itself.
