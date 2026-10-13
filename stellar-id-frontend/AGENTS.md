# AGENTS.md — stellar-id-frontend

This package is part of the Stellar Identity & Authentication Suite monorepo. The authoritative agent rules live at the monorepo root: read `../AGENTS.md` first, then `../STATUS.md`, then the current phase in `../PLAYBOOK.md`.

## Package specifics

- React/Next.js component library + `demo/` Next.js app. Conventions: function components, accessible by default, CSS-variable theming (no hardcoded colors), SSR-safe (no `window` at import time), no UI-library lock-in.
- Verify command: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (demo: `cd demo && pnpm build`)
- Commits: Conventional Commits with the `frontend` scope, one package per commit.
- The SDK enters this package as a real semver dependency on `stellar-id-client` (Phase 5/7) — never by path.
- Cross-package dependency direction: `core` → `client` → `frontend` → `docs`. Never reverse it.
