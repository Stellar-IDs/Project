# Contributing to stellar-id-frontend

Thanks for your interest! This package is part of the Stellar Identity & Authentication Suite monorepo.

## Setup

1. Install Node.js 20+ and pnpm 12 (see `PLAYBOOK.md` §6 in the monorepo root).
2. `pnpm install --frozen-lockfile` (installs the library and the `demo/` app)

## Verify (run before every commit)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Conventions

- Conventional Commits with the package scope: `feat(frontend): add useIdentity hook`
- One package per commit
- React function components; accessible by default; styling via CSS variables, no hardcoded colors
- SSR safety: no `window` access at import time; wallet code only in effects and handlers
- Component tests use Testing Library + axe (Phase 5); every component has error and loading states
- The library depends on `stellar-id-client` via a real semver range once the client is published (Phase 7) — never by path
- Testnet only. Never commit secrets, seed phrases, or API keys.

## Issues

- Bug reports and feature requests: use the templates in `.github/ISSUE_TEMPLATE`.
- Wave contributor tasks use `wave-task.md` and the MVP boundary defined in `PLAYBOOK.md` §12: build the plug-in point the issue hooks into, not the issue itself.
