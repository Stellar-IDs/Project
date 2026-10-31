# Changelog

All notable changes to `stellar-id-frontend`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/). Not published to npm yet. Testnet only.

## [Unreleased]

### Fixed
- Demo: registers the wallet's DID before sign-in (new wallets previously could
  not sign in); an invalid pasted secret shows an inline error instead of a
  dead-end page.
- Demo: Next.js upgraded to `^16.4.1` (critical advisories in 16.4.0).

### Added
- Playwright e2e for the demo: offline setup test and the full testnet flow
  (throwaway keypair in place of a wallet extension).

## [0.1.0] - 2026-10-15

### Added
- `SessionProvider`, `IdentityLogin`, `IdentityProfile` / `IdentityProfileView`,
  `CredentialBadge`, `withAuth`.
- Hooks: `useIdentity`, `useIdentityStatus`, `useDidDocument`, `useCredential`.
- CSS-variable theming with dark mode, Storybook stories, axe checks in tests.
- Next.js demo app (`demo/`).
