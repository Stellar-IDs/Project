# stellar-id-frontend

React components and hooks for building identity-aware applications on Stellar: `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, the `useIdentity` / `useDidDocument` / `useCredential` / `useIdentityStatus` hooks, and the `withAuth` HOC.

**Status:** Phase 0 scaffold — v0.x, testnet only. The components, hooks, and CSS-variable theme are implemented in Phase 5 (see `PLAYBOOK.md` §8 in the monorepo root). This package currently exports only placeholder metadata so it builds, lints, tests, and packages green.

## What's implemented

- Library skeleton with dual ESM + CJS build (`tsup`), React as a peer dependency
- Storybook 10 configuration (`@storybook/react-vite`) — stories arrive with the components in Phase 5
- Vitest test harness with a placeholder test
- `demo/` — a Next.js (App Router) app skeleton

## Development

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Storybook: `pnpm storybook` (no stories until Phase 5).

Demo app: `cd demo && pnpm dev`.

Full monorepo verification: `scripts/verify-all.sh` (from the repo root, Git Bash on Windows).

## Conventions (from Phase 5 onward)

- Function components, accessible by default (labels, focus order, keyboard, ARIA only when needed)
- Theming via CSS variables (`--sid-color-primary`, …); no hardcoded colors
- SSR safety: nothing touches `window` at import time; wallet code only in effects/handlers
- No UI-library lock-in; minimal default CSS

## Contributing

See `CONTRIBUTING.md`. Issue and PR templates live in `.github/`.

## Security

See `SECURITY.md`.

## License

Apache-2.0. See `LICENSE`.
