# stellar-id-frontend

Accessible, themeable React components and hooks for `did:stellar` sign-in
and identity UI, built on `stellar-id-client`.

**Status:** testnet only, v0.x, **not published to npm yet**. Sign-in with
real extension wallets (Freighter etc.) has not been verified; the demo and
e2e use a throwaway keypair. No hosted demo yet.

## Install

Once published: `pnpm add stellar-id-frontend stellar-id-client @stellar/stellar-sdk`
(React 18 or 19 as a peer). Until then, install tarballs built with
`pnpm build && pnpm pack`.

## 30-second example

```tsx
"use client";
import "stellar-id-frontend/styles.css";
import { SessionProvider, IdentityLogin, IdentityProfile } from "stellar-id-frontend";
import type { Signer } from "stellar-id-client";

export function App({ createSigner }: { createSigner: () => Promise<Signer> }) {
  return (
    <SessionProvider config={{ createSigner }}>
      <IdentityLogin />
      <IdentityProfile />
    </SessionProvider>
  );
}
```

The signer's account must already have an on-chain DID (`createIdentity`
in `stellar-id-client`), or sign-in fails with `DidNotFoundError`.

## What's implemented

- `SessionProvider`: wallet connection plus challenge/response sign-in, with
  in-memory nonce replay protection.
- `IdentityLogin`, `IdentityProfile` / `IdentityProfileView` (read-only),
  `CredentialBadge` (Valid / Revoked / Expired / Unknown as text, not color only).
- Hooks: `useIdentity` and `useIdentityStatus` (session state), plus
  `useDidDocument` and `useCredential` (cached and deduped; they return
  `{ data, error, status, refetch }`).
- `withAuth`: client-side route gating for UX only. Real protection must be
  server-side.
- Theming through `--sid-*` CSS variables, with dark mode via `data-sid-theme="dark"`;
  `"use client"` builds that are safe to import during SSR.
- Tests: 26 unit tests including axe checks; Storybook stories for the
  three main components; Playwright e2e for the demo.

**Not yet:** a verified real-wallet flow, profile editing, a theme builder,
a formal accessibility audit, and axe checks in Storybook.

## Demo

`demo/` is a Next.js app that runs the full flow on testnet: register a
DID, sign in, issue a credential, revoke it, and watch the badge change. See
[`demo/README.md`](demo/README.md).

## Development

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm storybook                          # http://localhost:6006
cd demo && pnpm build && pnpm e2e       # e2e (needs testnet access)
```

## Contributing · Security · License

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · Apache-2.0 ([LICENSE](LICENSE)) · [CHANGELOG.md](CHANGELOG.md)
