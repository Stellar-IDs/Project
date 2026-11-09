# Roadmap — frontend

Where the React components stand and what comes next. No dates are promised; this file is updated as items land.
Status: **testnet only, v0.x.**

## Done (0.1.0, on npm)

- [`stellar-id-frontend@0.1.0`](https://www.npmjs.com/package/stellar-id-frontend): `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, `withAuth` and the query hooks, themed
  through `--sid-*` CSS variables (light and dark); 26 unit tests including axe checks; Storybook stories.
- The [hosted demo](https://stellar-ids.github.io/frontend/) runs the full testnet flow (register a DID, sign in,
  issue and revoke a credential), covered by Playwright end-to-end tests.

## Open for contributors (Wave)

| Issue | Points | What it delivers |
|---|---|---|
| [#1 Social / passkey login fallback](https://github.com/Stellar-IDs/frontend/issues/1) | 3 | A login provider with a documented custody and security model |
| [#2 Profile editing UI](https://github.com/Stellar-IDs/frontend/issues/2) | 3 | Edit keys and services with transaction state and confirmations |
| [#3 Theme customization](https://github.com/Stellar-IDs/frontend/issues/3) | 2 | Theme presets, a provider API, high contrast |
| [#4 Accessibility audit](https://github.com/Stellar-IDs/frontend/issues/4) | 2 | A written WCAG 2.2 AA audit with keyboard and screen-reader testing |

Each issue has a `TODO(wave: frontend-N)` marker at its plug-in point in the code (#4: in the component tests).

## Maintainer track

- Wire a browser-extension wallet (`WalletsKitSigner`) into the demo once client #2 has verified real wallets.
- axe checks in Storybook; Changesets for releases.

## Not planned for v1

Mainnet support and a custodial wallet.
