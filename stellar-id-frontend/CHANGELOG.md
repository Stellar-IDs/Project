# Changelog

All notable changes to `stellar-id-frontend`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/). Testnet only.

## [0.1.0] - 2026-11-09

Tag `v0.1.0`. **Not on npm yet**: the npm release will be published from this tag.

### Added
- `SessionProvider`, `IdentityLogin`, `IdentityProfile` / `IdentityProfileView`,
  `CredentialBadge`, `withAuth`.
- Hooks: `useIdentity`, `useIdentityStatus`, `useDidDocument`, `useCredential`.
- CSS-variable theming with dark mode, Storybook stories, axe checks in tests.
- Next.js demo app (`demo/`): registers the wallet's DID before sign-in, issues and
  revokes a credential, and shows an inline error for an invalid pasted secret.
  Next.js `^16.4.1` (critical advisories in 16.4.0).
- Hosted demo at https://stellar-ids.github.io/frontend/: a static export
  (`DEMO_STATIC_EXPORT=1`; `?demowallet=1` is read in the browser) deployed to
  GitHub Pages by `.github/workflows/deploy.yml`. Page styles use only the
  `--sid-*` tokens; `demo/demo.gif` in the README was recorded from it.
- Playwright e2e for the demo: offline setup test and the full testnet flow
  (throwaway keypair in place of a wallet extension).
- `ROADMAP.md`.
