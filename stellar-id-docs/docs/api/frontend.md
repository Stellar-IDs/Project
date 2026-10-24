---
id: api-frontend
title: Frontend Components
sidebar_label: Frontend (React)
sidebar_position: 2
---

# Frontend API (`stellar-id-frontend`)

All components/hooks carry `"use client"` for Next.js App Router.

## Session & Identity

```tsx
import {
  SessionProvider,
  useSession,
  useSessionActions,
  useIdentity,
  useIdentityStatus,
} from "stellar-id-frontend";
```

### `SessionProvider`

```tsx
<SessionProvider config={{ createSigner: () => mySigner }}>
  <App />
</SessionProvider>
```

- `config.createSigner()` → `Signer` (required)
- `config.network?` → `NetworkConfig` (defaults to testnet)
- `config.domain?` → string (challenge domain, defaults to `window.location.hostname`)

### `useSession()` → `SessionState`

```ts
const { status, address, did, error } = useSession();
// status: "disconnected" | "connecting" | "connected" | "authenticating" | "authenticated" | "error"
```

### `useSessionActions()` → `SessionActions`

```ts
const { connect, disconnect, signIn } = useSessionActions();
```

### `useIdentity()` → `{ did, address, status }`

### `useIdentityStatus()` → `{ status, isConnected, isAuthenticated }`

## Data Hooks

```tsx
import { useDidDocument, useCredential } from "stellar-id-frontend";
```

### `useDidDocument(did: string | null, opts?)`

```ts
const { data, error, status, refetch } = useDidDocument(did, {
  network,
  resolve, // optional injected resolver
});
// QueryResult<ResolutionResult>: { data, error, status, refetch }
```

### `useCredential(credential: VerifiableCredential | null, opts?)`

```ts
const { data, error, status, refetch } = useCredential(credential, {
  network,
  verify,
  cacheSuffix, // force revalidation after revocation
});
```

## Components

### `IdentityLogin`

```tsx
<IdentityLogin
  onAuthenticated={(did) => console.log(did)}
  label="Sign in with Stellar"
/>
```

- On success calls `onAuthenticated(did)` once.
- Dark mode via `data-sid-theme="dark"` ancestor.

### `IdentityProfile` (session-aware) / `IdentityProfileView` (explicit DID)

```tsx
// Session-aware
<IdentityProfile network={network} resolve={customResolve} />

// Explicit DID (no provider needed)
<IdentityProfileView did={did} network={network} resolve={customResolve} />
```

### `CredentialBadge`

```tsx
<CredentialBadge
  credential={credential}
  network={network}
  verify={customVerify}
  refreshToken={1} // force revalidation after revocation
/>
```

- States: `checking` | `valid` | `revoked` | `expired` | `unknown` | `error`
- Always text-announced (`aria-live`), never color-only.

### `withAuth` HOC

```tsx
const Guarded = withAuth(SecretPage, {
  fallback: <p>Please sign in.</p>,
});
```

- Client-side UX only — real protection must be server-side.

## Theme

CSS variables in `stellar-id-frontend/styles.css`:

```css
:root {
  --sid-color-primary: #1a56db;
  --sid-color-primary-text: #ffffff;
  --sid-color-text: #111827;
  --sid-color-muted: #6b7280;
  --sid-color-background: #ffffff;
  --sid-color-surface: #f3f4f6;
  --sid-color-border: #d1d5db;
  --sid-color-success: #047857;
  --sid-color-success-bg: #d1fae5;
  --sid-color-warning: #b45309;
  --sid-color-warning-bg: #fef3c7;
  --sid-color-error: #b91c1c;
  --sid-color-error-bg: #fee2e2;
  --sid-radius: 0.5rem;
  --sid-font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  --sid-spacing: 0.75rem;
}
[data-sid-theme="dark"] { /* ... */ }
```

Import once: `import "stellar-id-frontend/styles.css";`

---

**Next:** [Contract Methods](../api/contract.md)