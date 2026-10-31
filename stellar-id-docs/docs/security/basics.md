---
id: security-basics
title: Security Basics
sidebar_label: Basics
sidebar_position: 1
---

# Security Basics

> This is a concise checklist. A comprehensive best-practices guide is
> planned as a contributor issue.

{/* TODO(wave: docs-4): the comprehensive security guide (key management, phishing, replay, revocation, privacy, incident response) expands this page. */}

## Key Handling

- **Never commit secrets.** Use `.env` (gitignored) for testnet secrets.
  Production keys belong in HSMs, vaults, or secure enclaves.
- **Testnet only.** The deployed contract and all examples target Stellar
  testnet. Mainnet is an explicit non-goal for v1.
- **Rotate if leaked.** Any key that appears in git, logs, screenshots,
  or CI output is compromised — rotate immediately.

## Phishing Resistance

- **Domain binding.** `createChallenge` includes the app domain. Verify
  the domain matches your origin before signing.
- **Wallet UI.** Verify the wallet shows the expected domain and
  challenge details before approving.
- **No password fallback.** There is no password to phish. The only
  credential is the wallet's private key.

## Replay Protection

- **Nonce.** Every challenge includes a 16-byte random nonce.
- **Single-use.** The SDK's `InMemoryNonceStore` (dev default) rejects
  replayed nonces. Production apps must persist nonces (DB, Redis).
- **Expiry.** Challenges expire after 5 minutes (configurable via `ttlSeconds`).

## On-Chain Data

- **No PII.** Only keys, hashes, status flags, and HTTPS service
  endpoints go on-chain. Credential contents stay off-chain.
- **Hash-only anchoring.** Only the SHA-256 of the JCS-canonicalized
  credential is stored. Contents are never on-chain.
- **Revocation is terminal.** A revoked credential hash can never be
  re-anchored. This prevents silent re-issuance.

## Trap Behaviour (SDK)

`verify_credential_proof` uses Soroban's `ed25519_verify`, which **traps
(on failure, aborts the transaction/simulation)** rather than returning
false. The SDK surfaces this as a thrown error, not a `false` return.
Treat any failure as "invalid proof".

## Contract Safety

- **No admin override.** The contract has no admin role that can mutate
  DIDs or credentials.
- **Self-controlled.** The DID subject = the controller address. No
  separate `controller` field in the document.
- **TTL extension.** Every write extends TTL. `bump_ttl` lets anyone
  pay to keep a DID alive.
- **Deactivated = immutable.** Mutations reject with `Deactivated`;
  resolution still returns the tombstone.

## Network Safety

- **Testnet only.** All guides, examples, and the demo target
  `Test SDF Network ; September 2015`.
- **Friendbot rate limits.** Funding new accounts back-to-back may fail;
  wait a minute and retry.
- **RPC reliability.** Use a reliable RPC endpoint; the SDK retries
  transport errors with backoff.

---

**Next:** [Migration from Traditional Auth](../migration/from-auth.md)