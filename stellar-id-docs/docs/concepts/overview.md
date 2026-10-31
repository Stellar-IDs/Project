---
id: concepts-overview
title: Core Concepts
sidebar_label: Overview
sidebar_position: 1
---

# Core Concepts

The Stellar Identity & Authentication Suite provides a complete identity layer
built on Stellar/Soroban. Here are the key concepts you need to understand.

## What is a DID?

A **Decentralized Identifier (DID)** is a URI that resolves to a **DID
Document** containing public keys, service endpoints, and relationship
metadata. Unlike traditional identifiers (email, usernames), DIDs are:

- **Self-controlled**: the entity that controls the DID is the DID subject.
- **Cryptographically verifiable**: resolution returns keys that prove
  ownership.
- **Network-independent**: a DID method defines how DIDs are created and
  resolved on a specific network.

## The `did:stellar` Method

This suite implements the `did:stellar` DID method with these design
choices:

| Property | Value |
|---|---|
| **Syntax** | `did:stellar:<network>:<strkey-address>` |
| **Networks** | `testnet` (v1), `public` (mainnet, non-goal for v1) |
| **Method-specific ID** | The Stellar address itself (`G...`) |
| **Controller** | The address itself (1:1 mapping) |
| **Verification keys** | Ed25519 public keys stored as raw 32-byte values |

**Example DIDs:**
```
did:stellar:testnet:GABCD...XYZ
did:stellar:public:GBDEF...UVW
```

## DID Document Structure

When resolved, a `did:stellar` DID returns a W3C-compliant JSON-LD document:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/multikey/v1"
  ],
  "id": "did:stellar:testnet:GABC...",
  "verificationMethod": [
    {
      "id": "did:stellar:testnet:GABC...#key-1",
      "type": "Multikey",
      "controller": "did:stellar:testnet:GABC...",
      "publicKeyMultibase": "z6Mk..."
    }
  ],
  "authentication": ["did:stellar:testnet:GABC...#key-1"],
  "assertionMethod": ["did:stellar:testnet:GABC...#key-1"],
  "service": [
    {
      "id": "did:stellar:testnet:GABC...#credential-issuer",
      "type": "VerifiableCredentialService",
      "serviceEndpoint": "https://example.com/credentials"
    }
  ]
}
```

## Verification Methods & Relationships

- **Verification Method**: a public key with a fragment id (e.g., `key-1`).
- **Authentication**: keys the subject uses to authenticate (sign-in).
- **Assertion Method**: keys the subject uses to sign credentials.
- **v1 limit**: 10 verification methods, 10 services per DID.

## Verifiable Credentials

The suite handles **off-chain** Verifiable Credentials (W3C VC data model).
Only the **SHA-256 hash** of the JCS-canonicalized credential JSON is
anchored on-chain, plus revocation/expiry status.

- **Issue**: issuer signs JCS(credential) with an Ed25519 key in their DID's
  `assertionMethod`.
- **Anchor**: issuer stores the hash on-chain (optional, enables revocation).
- **Verify**: check signature locally + check on-chain status (Active/Revoked/Expired/Unknown).
- **Revoke**: issuer flags the hash as revoked (terminal; hash can never be re-anchored).

## Sign-In Flow

1. App creates a **challenge** (nonce, domain, expiry).
2. User's wallet signs the challenge bytes.
3. SDK verifies: resolves DID → finds signing key in `authentication` →
   Ed25519 verify → checks nonce/expiry/domain.
4. On success, the app receives an authenticated DID and issues its own
   session cookie/JWT.

## TTL & Archival

Soroban storage entries expire unless their TTL is extended. The contract
extends TTL on every write. Anyone can call `bump_ttl` to keep a DID from
being archived. Archived entries require restoration before use.

## Network

**Testnet only for v1.** The deployed contract:
- Contract ID: `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`
- Network passphrase: `Test SDF Network ; September 2015`
- RPC: `https://soroban-testnet.stellar.org`

---

**Next:** [Quick Start (Node)](../quickstart/node.md) or
[Quick Start (React)](../quickstart/react.md)