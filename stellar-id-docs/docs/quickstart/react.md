---
id: quickstart-react
title: Quick Start (React)
sidebar_label: React
sidebar_position: 2
---

# Quick Start: React Components

Add wallet-based sign-in and identity UI to a React/Next.js app.

> **Prerequisites:** Node 20+, React 18/19, a testnet account.

## 1. Install

```bash
pnpm add stellar-id-frontend stellar-id-client @stellar/stellar-sdk
```

Neither package is **published to npm yet**. Until they are, install
tarballs built with `pnpm build && pnpm pack` in each repo (see the
[Node quick start](./node.md)).

## 2. Wrap Your App with `SessionProvider`

```tsx
// providers.tsx
"use client";

import { Buffer } from "buffer";
import { SessionProvider } from "stellar-id-frontend";
import { WalletsKitSigner } from "stellar-id-client";
import type { Signer } from "stellar-id-client";
import { getWalletsKit } from "./wallets-kit"; // your app's kit setup

if (typeof globalThis.Buffer === "undefined") {
  (globalThis as Record<string, unknown>)["Buffer"] = Buffer;
}

async function createSigner(): Promise<Signer> {
  // An initialized @creit.tech/stellar-wallets-kit instance with a wallet
  // selected; see the kit's own docs for its setup.
  return new WalletsKitSigner(await getWalletsKit());
}

export function SessionProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider config={{ createSigner }}>{children}</SessionProvider>;
}
```

> **Never put a secret key in browser code.** `KeypairSigner` is for
> Node, tests and throwaway testnet keys only.
>
> **Status:** `WalletsKitSigner` is tested against a fake kit only. Signing
> in with a real extension wallet (Freighter etc.) has not been verified
> yet, and message-signing support varies by wallet.

```tsx
// app/layout.tsx
import { SessionProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviders>{children}</SessionProviders>
      </body>
    </html>
  );
}
```

## 3. Add a Sign-In Button

Sign-in verifies the wallet's signature against its **on-chain DID**, so
the account must have one first (create it with `createIdentity`, as in
the [Node quick start](./node.md)). Otherwise sign-in fails with
`DidNotFoundError`.

```tsx
// components/SignIn.tsx
"use client";

import { IdentityLogin } from "stellar-id-frontend";

export function SignIn() {
  return (
    <IdentityLogin
      onAuthenticated={(did) => console.log("Signed in as:", did)}
    />
  );
}
```

## 4. Show the User's Profile

```tsx
// components/Profile.tsx
"use client";

import { IdentityProfile, useIdentityStatus } from "stellar-id-frontend";

export function Profile() {
  const { isAuthenticated } = useIdentityStatus();

  if (!isAuthenticated) {
    return <p>Sign in to view your profile.</p>;
  }

  return <IdentityProfile />;
}
```

## 5. Display a Credential Badge

```tsx
// components/CredentialBadgeDemo.tsx
"use client";

import { CredentialBadge } from "stellar-id-frontend";

export function CredentialBadgeDemo({ credential }: { credential: VerifiableCredential }) {
  return <CredentialBadge credential={credential} />;
}
```

## 6. Protect Routes (Client-Side Only)

```tsx
// components/Protected.tsx
"use client";

import { withAuth } from "stellar-id-frontend";

const ProtectedPage = () => <p>Secret content!</p>;

export default withAuth(ProtectedPage, {
  fallback: <p>Please sign in to continue.</p>,
});
```

> ⚠️ **Client-side protection is UX only.** Real protection requires
> server-side session validation (cookies/JWTs). The SDK provides the
> authentication primitive; session issuance is your backend's job.

## Demo App

See `demo/` in the `stellar-id-frontend` repo. It runs the full flow on
testnet with a throwaway keypair (not an extension wallet): fund, register
the DID, sign in, show the profile, issue and revoke a credential. A
Playwright test covers that flow. The demo is not hosted anywhere yet.

---

**Next:** [API Reference](../api/overview.md) or [Concepts](../concepts/overview.md)