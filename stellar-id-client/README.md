# stellar-id-client

TypeScript SDK for the Stellar Identity & Authentication Suite: `createIdentity()`, `resolveIdentity()`, `verifyCredential()`, sign-in challenge helpers, wallet adapters, and `toW3CDocument()`.

**Status:** Phase 0 scaffold — v0.x, testnet only. The public API is implemented in Phase 4 (see `PLAYBOOK.md` §8 in the monorepo root). This package currently exports only placeholder metadata so it builds, lints, tests, and packages green.

## What's implemented

- Dual ESM + CJS build with TypeScript declarations (`tsup`)
- ESLint (flat config) + Prettier
- Vitest test harness with a placeholder test
- `exports` map and `files` allowlist for npm publishing (publishing is a Phase 7 step)

## Development

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Full monorepo verification: `scripts/verify-all.sh` (from the repo root, Git Bash on Windows).

## Documentation

- Contract interface: `PLAYBOOK.md` §3 in the monorepo root
- API reference: Phase 4 deliverable (JSDoc on every public export)

## Contributing

See `CONTRIBUTING.md`. Issue and PR templates live in `.github/`.

## Security

See `SECURITY.md`.

## License

Apache-2.0. See `LICENSE`.
