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

## 2. Wrap Your App with `SessionProvider`

```tsx
// providers.tsx
"use client";

import { Buffer } from "buffer";
import { SessionProvider } from "stellar-id-frontend";
import { KeypairSigner } from "stellar-id-client";
import type { Signer } from "stellar-id-client";

if (typeof globalThis.Buffer === "undefined") {
  (globalThis as Record<string, unknown>)["Buffer"] = Buffer;
}

function createSigner(): Signer {
  // Replace with your wallet signer in production
  return KeypairSigner.fromSecret(process.env.STELLAR_SECRET!);
}

export function SessionProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider config={{ createSigner }}>{children}</SessionProvider>;
}
```

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

See `stellar-id-frontend/demo` — it runs the full flow on testnet:
auto-funded wallet → sign-in → profile → issue/verify/revoke credential.

---

**Next:** [API Reference](../api/overview.md) or [Concepts](../concepts/overview.md)