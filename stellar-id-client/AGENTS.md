# AGENTS.md — stellar-id-client

This package is part of the Stellar Identity & Authentication Suite monorepo. The authoritative agent rules live at the monorepo root: read `../AGENTS.md` first, then `../STATUS.md`, then the current phase in `../PLAYBOOK.md`.

## Package specifics

- TypeScript SDK. Conventions: `strict: true`, no `any`, ESM + CJS dual build, JSDoc on every public function, typed error classes (`StellarIdError` subclasses) — never string errors.
- Verify command: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Commits: Conventional Commits with the `client` scope, one package per commit.
- The Soroban contract interface enters this package **only** as generated bindings committed under `src/generated/` (Phase 3). Never import from `stellar-id-core` by path.
- Cross-package dependency direction: `core` → `client` → `frontend` → `docs`. Never reverse it.
