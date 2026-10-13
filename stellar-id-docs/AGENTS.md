# AGENTS.md — stellar-id-docs

This package is part of the Stellar Identity & Authentication Suite monorepo. The authoritative agent rules live at the monorepo root: read `../AGENTS.md` first, then `../STATUS.md`, then the current phase in `../PLAYBOOK.md`.

## Package specifics

- Docusaurus 3 (MDX). Conventions: docs describe only what is implemented and tested; code samples match the tested examples; every guide states the network (testnet only for v1).
- Verify command: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (the build fails on broken links).
- Commits: Conventional Commits with the `docs` scope, one package per commit.
- Docs reference published package names, not monorepo paths.
- Cross-package dependency direction: `core` → `client` → `frontend` → `docs`. Never reverse it.
