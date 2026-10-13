# stellar-id-docs

Documentation site for the Stellar Identity & Authentication Suite, built with Docusaurus.

**Status:** Phase 0 scaffold — v0.x, testnet only. The site structure, tooling, and CI are green; the guides and API reference are written in Phases 4–6 (see `PLAYBOOK.md` §8 in the monorepo root).

## What's implemented

- Docusaurus 3 site with docs sidebar, home page, and theme entry point
- Link checking built into the build (`onBrokenLinks: "throw"`)
- ESLint + Prettier + `tsc --noEmit` + a Vitest smoke test for the site config

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev        # local preview
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest
pnpm build      # docusaurus build (fails on broken links)
```

Full monorepo verification: `scripts/verify-all.sh` (from the repo root, Git Bash on Windows).

## Content plan (Phases 4–6)

Concepts (DIDs, `did:stellar` syntax, verification methods, credentials, revocation, TTL/archival, resource fees), Node and React quick-starts, API reference (contract methods, SDK exports, components and hooks), security basics, migration from traditional auth, and a compatibility matrix.

## Contributing

See `CONTRIBUTING.md`. Issue and PR templates live in `.github/`.

## Security

See `SECURITY.md`.

## License

Apache-2.0. See `LICENSE`.
