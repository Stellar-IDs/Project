# Contributing to stellar-id-docs

Thanks for your interest! This package is part of the Stellar Identity & Authentication Suite monorepo.

## Setup

1. Install Node.js 20+ and pnpm 12 (see `PLAYBOOK.md` §6 in the monorepo root).
2. `pnpm install --frozen-lockfile`

## Verify (run before every commit)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`pnpm build` fails on broken links — always run it before pushing docs changes.

## Conventions

- Conventional Commits with the package scope: `docs(docs): add react guide`
- One package per commit
- MDX for docs pages; code samples must match the tested examples in the other packages
- Docs describe only what is implemented and tested — no aspirational feature claims
- Docs reference published package names (`stellar-id-client` on npm), not monorepo paths
- Every guide states the network it targets: **testnet only** for v1

## Issues

- Bug reports and feature requests: use the templates in `.github/ISSUE_TEMPLATE`.
- Wave contributor tasks use `wave-task.md` and the MVP boundary defined in `PLAYBOOK.md` §12: build the plug-in point the issue hooks into, not the issue itself.
