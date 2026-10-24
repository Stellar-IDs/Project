---
id: api-overview
title: API Reference
sidebar_label: Overview
sidebar_position: 1
---

# API Reference

## Packages

| Package | NPM | Description |
|---|---|---|
| `stellar-id-core` | (contract) | Soroban contract (Rust/WASM) |
| `stellar-id-client` | `stellar-id-client` | TypeScript SDK |
| `stellar-id-frontend` | `stellar-id-frontend` | React components + hooks |
| `stellar-id-docs` | (site) | This documentation |

## Client SDK (`stellar-id-client`)

### Identity Lifecycle

```ts
// Creation
createIdentity(opts: { signer: Signer; network?: NetworkConfig; keys?: NewKey[]; services?: NewService[] })
  => Promise<Identity> // { did, parsed, hash }

// Resolution
resolveIdentity(did: string, opts?: ResolveOptions)
  => Promise<ResolutionResult>

// Mutations (each returns TxResult[] with hashes)
updateIdentity(did: string, patch: IdentityPatch, opts: MutateOptions)
  => Promise<TxResult[]>
deactivateIdentity(did: string, opts: MutateOptions)
  => Promise<TxResult>
```

### Verifiable Credentials

```ts
// Issue (off-chain JSON, optional on-chain anchor)
issueCredential(opts: IssueCredentialOptions)
  => Promise<IssuedCredential> // { credential, hash, anchorTx? }

// Verify (local signature + on-chain status)
verifyCredential(credential: VerifiableCredential, opts?: VerifyCredentialOptions)
  => Promise<VerificationResult> // { valid: true, did, hash }

// Revoke (terminal)
revokeCredential(hashHex: string, opts: RevokeCredentialOptions)
  => Promise<{ hash: string }>
```

### Sign-In Challenges

```ts
createChallenge(opts: CreateChallengeOptions) => Challenge
challengeBytes(challenge: Challenge) => Uint8Array
verifyChallengeResponse(resp: ChallengeResponse, opts?: VerifyChallengeOptions)
  => Promise<AuthenticatedIdentity>
```

### W3C Rendering

```ts
toW3CDocument(record: DidRecord, did: string) => DidDocument
publicKeyToMultibase(publicKeyHex: string) => string // z...
multibaseToPublicKeyHex(multibase: string) => string
```

### Wallet Adapters

```ts
KeypairSigner.fromSecret(secret: string) => Signer
new WalletsKitSigner(kit: WalletKitLike, address?: string) => Signer
```

### Errors

All failures are typed `StellarIdError` subclasses:

- `DidParseError`, `DidNotFoundError`, `DidDeactivatedError`
- `InvalidProofError`, `CredentialRevokedError`, `CredentialExpiredError`
- `NetworkError`, `SimulationError`, `WalletError`

---

**Next:** [Frontend Components](../api/frontend.md) | [Contract Methods](../api/contract.md)