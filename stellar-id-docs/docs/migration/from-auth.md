---
id: migration-from-auth
title: Migration from Traditional Auth
sidebar_label: From Password/OAuth
sidebar_position: 1
---

# Migration from Traditional Auth

A concise mapping for teams moving from password/OAuth to DID-based
wallet authentication.

## Concept Mapping

| Traditional | Stellar Identity | Notes |
|---|---|---|
| Email / Username | `did:stellar:testnet:G...` | Self-controlled, cryptographically verifiable |
| Password hash | Ed25519 private key (in wallet) | Never leaves the wallet; signs challenges |
| Password check | Challenge/response + Ed25519 verify | Wallet signs server-generated challenge |
| Session cookie / JWT | Your backend's session cookie / JWT | Unchanged — SDK only authenticates the challenge |
| "Forgot password" | Wallet recovery (seed phrase / device) | No central reset; user controls recovery |
| MFA / 2FA | Wallet PIN / biometric / hardware | Built into the wallet, not your app |
| Social login (Google, etc.) | Not in v1 | Wallet-only; social/passkey is a Wave issue |
| Account deletion | DID deactivation (terminal) | `deactivate_did` — tombstone stays resolvable |

## Flow Comparison

### Traditional Login
```
1. User enters email + password
2. Server hashes password → compares to DB
3. On match → issue session cookie/JWT
```

### Stellar Identity Sign-In
```
1. Server creates Challenge (nonce, domain, expiry)
2. User's wallet signs Challenge bytes
3. Server verifies:
   a. Resolve DID → get authentication keys
   b. Ed25519 verify signature over challenge
   c. Check nonce unused, not expired, domain matches
4. On success → issue your session cookie/JWT
```

## Minimal Backend Changes

1. **Replace password check** with `verifyChallengeResponse`.
2. **Issue your own session** (cookie/JWT) exactly as before.
3. **Store the DID** (not the key) as the user identifier.
4. **Keep your existing session logic** — the SDK only handles
   the authentication step.

## Frontend Integration

```tsx
// Before: <input type="password" />
// After:
<IdentityLogin onAuthenticated={(did) => startSession(did)} />
```

## What You Lose (v1)

- Social login (Google, GitHub, etc.) — wallet-only.
- Password reset — wallet recovery only.
- Central admin override — no admin role in contract.

## What You Gain

- **No credential storage risk.** You never see or store private keys.
- **Phishing-resistant.** Domain-bound challenges; wallet shows the domain.
- **User-controlled.** Keys stay in the user's wallet (hardware, mobile, etc.).
- **Verifiable credentials.** Issue/revoke tamper-evident claims off-chain.

---

**Next:** [Compatibility Matrix](../reference/compatibility.md)