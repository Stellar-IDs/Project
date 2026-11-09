<div align="center">

# Stellar ID — Client SDK

**A typed TypeScript SDK for `did:stellar` identities on Stellar: create, resolve, update and deactivate DIDs, issue and verify credentials, and authenticate users with a signed challenge.**

[![CI](https://github.com/Stellar-IDs/client/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-IDs/client/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Network](https://img.shields.io/badge/network-testnet-orange)
[![npm](https://img.shields.io/npm/v/stellar-id-client)](https://www.npmjs.com/package/stellar-id-client)
![Status](https://img.shields.io/badge/status-v0.x-yellow)

**[Docs site](https://stellar-ids.github.io/docs/)** · [Live demo](https://stellar-ids.github.io/frontend/) · [Core contract](https://github.com/Stellar-IDs/core) · [Frontend](https://github.com/Stellar-IDs/frontend) · [Docs repo](https://github.com/Stellar-IDs/docs) · [Changelog](CHANGELOG.md)

</div>

> **Status — read this first.** Everything here targets **Stellar testnet**. Published on npm as
> [`stellar-id-client@0.1.0`](https://www.npmjs.com/package/stellar-id-client). Mainnet is an explicit
> non-goal for v1, and the contract underneath has had a self-review but no independent audit.

---

## Table of contents

1. [What this is](#what-this-is)
2. [Install](#install)
3. [Quick start](#quick-start)
4. [Concepts in one minute](#concepts-in-one-minute)
5. [API overview](#api-overview)
6. [Sign-in with a signed challenge](#sign-in-with-a-signed-challenge)
7. [Credentials](#credentials)
8. [Signers and wallets](#signers-and-wallets)
9. [Errors](#errors)
10. [Networks](#networks)
11. [Security notes](#security-notes)
12. [Development](#development)
13. [Project layout](#project-layout)
14. [Implemented, and not yet](#implemented-and-not-yet)
15. [Contributing, security and license](#contributing-security-and-license)

---

## What this is

`stellar-id-client` is the TypeScript layer between your application and the
[`core`](https://github.com/Stellar-IDs/core) Soroban contract. The contract stores DID documents and
credential hashes; this SDK turns that into an API you can call from Node or a browser:

- **Identity lifecycle** — `createIdentity`, `resolveIdentity`, `updateIdentity`, `deactivateIdentity`.
- **W3C output** — `toW3CDocument` renders the on-chain record as a standards-shaped DID Document
  (`Multikey`, `publicKeyMultibase`).
- **Verifiable credentials** — `issueCredential`, `verifyCredential`, `revokeCredential`, with JCS
  canonicalization and SHA-256 hashing that match the contract's test vectors byte for byte.
- **Authentication** — `createChallenge` / `verifyChallengeResponse` implement a challenge/response
  sign-in with domain binding, expiry and replay protection.
- **Signers** — `KeypairSigner` for servers and tests, `WalletsKitSigner` for browser wallets via
  [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit).
- **Typed errors** — every failure is a `StellarIdError` subclass you can `instanceof`; nothing is thrown as a bare string.

It does **not** host a resolver service, store sessions, or send anything off-chain. Reads go straight
to a Soroban RPC node; writes are simulated, signed by your signer and submitted by you.

## Install

```bash
pnpm add stellar-id-client @stellar/stellar-sdk@^16.4.1
# or: npm install stellar-id-client @stellar/stellar-sdk@^16.4.1
```

`@stellar/stellar-sdk` is only needed directly if your code imports it (the quick start below does, for
`StrKey`); `^16.4.1` matches the client's own range, so a single copy is installed.

Requires **Node 20 or newer**. The package ships ESM and CommonJS builds with type declarations.

## Quick start

A complete lifecycle on testnet. You need a **funded testnet account** — generate a throwaway key,
fund it with [Friendbot](https://friendbot.stellar.org), and keep the secret in an environment variable
(never in source control).

```ts
import { StrKey } from "@stellar/stellar-sdk";
import {
  createIdentity,
  resolveIdentity,
  updateIdentity,
  issueCredential,
  verifyCredential,
  revokeCredential,
  deactivateIdentity,
  KeypairSigner,
} from "stellar-id-client";

const signer = KeypairSigner.fromSecret(process.env.STELLAR_ID_SECRET!);

// 1. Register a DID. key-1 is the account's own key, so credentials it signs verify on-chain.
const address = await signer.publicKey();
const accountKeyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");
const identity = await createIdentity({
  signer,
  keys: [{ id: "key-1", publicKeyHex: accountKeyHex }],
});
console.log(identity.did); // did:stellar:testnet:G...

// 2. Resolve it (read-only, no signing, no fee).
const resolved = await resolveIdentity(identity.did);
console.log(resolved.didDocument);

// 3. Add a service endpoint.
await updateIdentity(
  identity.did,
  { addServices: [{ id: "demo", kind: "Demo", endpoint: "https://example.com/demo" }] },
  { signer },
);

// 4. Issue a credential: it is hashed and the hash is anchored on-chain.
const { credential, hash } = await issueCredential({
  issuerSigner: signer,
  credentialSubject: { id: identity.did, role: "demo-tester" },
  anchor: {},
});

// 5. Verify it, revoke it, and watch verification fail.
await verifyCredential(credential);
await revokeCredential(hash, { issuerSigner: signer });
await verifyCredential(credential).catch((err) => console.log(err.code)); // credential revoked

// 6. Retire the DID.
await deactivateIdentity(identity.did, { signer });
```

A runnable version of exactly this flow lives in [`examples/node-basic`](examples/node-basic) and has
been run end to end against testnet:

```bash
pnpm build
cd examples/node-basic
STELLAR_ID_SECRET=S... node run.mjs     # or copy .env.example to .env
```

## Concepts in one minute

| Term | Meaning here |
|---|---|
| **DID** | `did:stellar:<network>:<G… address>` — derived from a Stellar account, no separate ID. |
| **Controller** | The account that owns the DID and must sign every change to it. |
| **Verification method** | A public key attached to the DID (Ed25519), with an id like `key-1`. |
| **`authentication`** | The keys allowed to prove control of the DID — used for sign-in. |
| **`assertionMethod`** | The keys allowed to sign credentials as the issuer. |
| **Anchor** | Storing a credential's SHA-256 hash on-chain so its status can be checked. The credential itself never goes on-chain. |
| **Tombstone** | What a deactivated DID resolves to: present, flagged, and immutable. |

## API overview

Every public export has JSDoc and at least one test.

### Identity

| Function | What it does | Needs a signer |
|---|---|:---:|
| `createIdentity({ signer, keys?, services?, … })` | Registers the DID for the signer's account. Returns `{ did, hash, … }`. | ✅ |
| `resolveIdentity(did, options?)` | Returns a W3C-style resolution result: `didDocument`, `didDocumentMetadata` (including `versionId`) and `didResolutionMetadata` (including `error` for tombstones). | — |
| `updateIdentity(did, patch, { signer })` | Applies a patch: `addKeys`, `removeKeyIds`, `authentication`, `assertionMethod`, `addServices`, `removeServiceIds`. | ✅ |
| `deactivateIdentity(did, { signer })` | Permanently deactivates the DID. | ✅ |
| `createDidReader(network)` | Builds a reusable read-only reader for repeated lookups. | — |
| `toW3CDocument(record, did)` | Renders an on-chain record as a JSON-LD DID Document (a minimal one for tombstones). | — |
| `parseDid(did)` / `formatDid(…)` | Parse and build DIDs with address checksum validation. | — |
| `publicKeyToMultibase` / `multibaseToPublicKeyHex` | Convert between raw Ed25519 keys and `z…` multibase. | — |

### Credentials

| Function | What it does |
|---|---|
| `issueCredential({ issuerSigner, credentialSubject, anchor? })` | Builds a credential, canonicalizes (JCS), hashes (SHA-256), signs with the issuer's key and optionally anchors the hash. |
| `verifyCredential(credential, options?)` | Resolves the issuer, checks key membership, checks the signature locally, then reads the on-chain status. Throws `InvalidProofError` (bad signature, unknown key, or never-anchored hash), `CredentialRevokedError` or `CredentialExpiredError`. |
| `revokeCredential(hash, { issuerSigner })` | Marks the anchored hash revoked. |
| `createStatusReader(network)` | Read-only status lookups (`Unknown`, `Active`, `Revoked`, `Expired`). |
| `canonicalize(value)` / `sha256Hex(text)` | The exact canonical JSON string and its hex SHA-256 that the contract's test vectors pin down. |

### Authentication

`createChallenge`, `challengeBytes`, `verifyChallengeResponse`, `InMemoryNonceStore`, `CHALLENGE_VERSION`
— see [Sign-in with a signed challenge](#sign-in-with-a-signed-challenge).

## Sign-in with a signed challenge

The pattern replaces a password: the server hands out a one-time challenge, the user's key signs it,
and the server checks the signature against the **authentication keys written in the user's DID**.

```ts
import {
  createChallenge, challengeBytes, verifyChallengeResponse, InMemoryNonceStore,
} from "stellar-id-client";

// ── Server: issue a challenge bound to your domain ──
const challenge = createChallenge({ domain: "app.example.com", ttlSeconds: 300 });

// ── Client: sign it with the user's signer (needs signMessage support) ──
const signature = await signer.signMessage!(challengeBytes(challenge));

// ── Server: verify ──
const nonceStore = new InMemoryNonceStore(); // dev only — use shared storage in production
const authenticated = await verifyChallengeResponse(
  {
    challenge,
    address: await signer.publicKey(),
    signatureHex: Buffer.from(signature).toString("hex"),
    domain: "app.example.com",
  },
  { nonceStore },
);
console.log(authenticated.did); // did:stellar:testnet:G...
```

`verifyChallengeResponse` rejects the attempt (with `InvalidProofError`) unless **all** of these hold:

1. the response domain equals the challenge domain,
2. the challenge is not bound to a different address,
3. the challenge has not expired,
4. the signer's DID exists and is **not deactivated**,
5. the signature verifies against a key listed in the DID's **`authentication`** relationship,
6. the nonce has not been used before (when a `nonceStore` is supplied).

The SDK deliberately does **not** invent a session format. After a successful verification, issue your
own cookie or token. Challenge bytes carry a version prefix (`CHALLENGE_VERSION`), so a sign-in signature can
never be confused with a credential signature.

> `InMemoryNonceStore` forgets everything on restart and does not work across multiple server instances.
> Implement the small `NonceStore` interface (`has`, `add`) on Redis or a database for production.

## Credentials

Credential contents never touch the chain. The flow is:

```
credential JSON ──JCS canonicalize──▶ bytes ──SHA-256──▶ hash ──anchor──▶ on-chain record
        │                                                      ▲
        └──── Ed25519 signature by the issuer's assertion key ─┘  (verified by verifyCredential)
```

The canonicalization and hashing are checked against shared vectors in
[`test/fixtures/test-vectors.json`](test/fixtures/test-vectors.json) (copied from the core contract),
including one deliberately invalid signature, so the SDK and the contract cannot silently drift apart.

The JCS implementation covers the documented subset of RFC 8785 used by credentials; it is not a general-purpose
canonicalizer.

## Signers and wallets

A `Signer` is the only place a key is used:

```ts
interface Signer {
  publicKey(): Promise<string>;                                     // the G... address
  signTransaction(xdr: string, opts: { networkPassphrase: string }): Promise<string>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;           // needed for sign-in
}
```

| Signer | Where to use it | Sign transactions | Sign messages | Verified how |
|---|---|:---:|:---:|---|
| `KeypairSigner` (secret seed) | Node, tests, CI | ✅ | ✅ | Unit tests and live testnet integration test |
| `WalletsKitSigner` + a Stellar Wallets Kit wallet | Browser | ✅ interface-tested with a fake kit | ⚠️ adapter only | **Not yet exercised with a real wallet** |

**Honest caveat:** Freighter, xBull, Albedo and LOBSTR have not been tested against testnet through
`WalletsKitSigner`. Message signing differs between wallets; when a wallet cannot sign messages the SDK
surfaces a `WalletError` rather than failing silently. Never put a secret seed in browser code.

## Errors

Every failure extends `StellarIdError`:

| Class | Raised when |
|---|---|
| `DidParseError` | The DID string is malformed or its address fails the checksum |
| `DidNotFoundError` | No DID is registered for the address |
| `DidDeactivatedError` | The DID is a tombstone and the operation needs an active one |
| `InvalidProofError` | A signature, challenge, domain or nonce check failed |
| `CredentialRevokedError` | The credential's anchor is revoked |
| `CredentialExpiredError` | The credential is past its expiry |
| `NetworkError` | The RPC node was unreachable (writes retry with backoff first) |
| `SimulationError` | The contract rejected the call in simulation |
| `WalletError` | The signer/wallet refused or cannot perform the operation |

```ts
try {
  await verifyCredential(credential);
} catch (err) {
  if (err instanceof CredentialRevokedError) { /* show "revoked" */ }
  else throw err;
}
```

Contract error codes (`Error(Contract, #N)`) from failed simulations are mapped to these classes by name,
so you rarely see raw RPC errors.

## Networks

`testnetConfig()` is the default everywhere and points at the public Soroban testnet RPC. `publicConfig()`
exists so the types and DID format (`did:stellar:public:…`) are complete, **but mainnet is unsupported and
untested**. Pass a `NetworkConfig` to override the RPC URL or contract ID.

Write operations: **simulate → sign → submit → poll**, with retry and backoff on transport errors only
(a contract rejection is never retried). Reads use simulation and cost nothing.

## Security notes

- **Secrets.** The example reads `STELLAR_ID_SECRET` from the environment; `.env` is git-ignored. Never commit
  or log a seed.
- **Authenticate on the server.** Run `verifyChallengeResponse` on your backend. Client-side checks are UX only.
- **Replay.** Bind challenges to your `domain`, keep them short-lived and use a shared `NonceStore`.
- **Trust the chain, not the URL.** A DID's service endpoints are untrusted input; validate before fetching them.
- **Testnet only.** Don't point real value at the v0.x contract.

Report vulnerabilities privately per [SECURITY.md](SECURITY.md).

## Development

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test          # unit tests, RPC mocked
pnpm build         # ESM + CJS + .d.ts via tsup

# live testnet integration test (funds a throwaway account via Friendbot)
INTEGRATION=1 pnpm vitest run test/integration.test.ts
```

Conventions: `strict: true`, no `any`, JSDoc and a happy-path plus a failure-path test for every public
function. The contract interface enters the package only as generated bindings committed in `src/generated/`.

**Regenerating bindings** after a contract change:

```bash
stellar contract bindings typescript --network testnet --contract-id <id> --output-dir <tmp>
# copy <tmp>/src/index.ts to src/generated/index.ts, rebuild, run the tests
```

## Project layout

```
src/
├── identity.ts     # createIdentity / updateIdentity / deactivateIdentity
├── resolver.ts     # resolveIdentity, createDidReader, resolution metadata
├── credentials.ts  # canonicalize, issue / verify / revoke, status reader
├── challenge.ts    # sign-in challenge + verification, NonceStore
├── signers.ts      # Signer, KeypairSigner, WalletsKitSigner
├── w3c.ts          # DID Document rendering, multibase keys
├── did.ts          # parseDid / formatDid
├── errors.ts       # StellarIdError hierarchy
├── networks.ts     # testnetConfig / publicConfig
├── gateway.ts      # RPC simulate/sign/submit/poll plumbing
└── generated/      # contract bindings (committed, generated by the Stellar CLI)
examples/node-basic # full lifecycle on testnet
test/               # unit tests, shared vectors, opt-in integration test
```

## Implemented, and not yet

**Implemented and tested:** the lifecycle functions above, W3C rendering, credential issue/verify/revoke,
challenge/response sign-in, `KeypairSigner`, a `WalletsKitSigner` adapter, typed errors, and a live testnet
integration run.

**Not yet — planned as open contributor issues** (extension points are marked `TODO(wave: client-N)`):

| Issue | Idea |
|---|---|
| client-1 | Types and parsing for newly registered DID methods and networks |
| client-2 | Verified connectors for real wallets (Freighter, xBull, Albedo, LOBSTR) |
| client-3 | Resolver fallback across multiple RPC endpoints |
| client-4 | Comprehensive SDK documentation: TypeDoc site, cookbook, error reference |

**Also not present:** social or passkey login, restoring archived ledger entries automatically, and
mainnet support.

## Contributing, security and license

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Vulnerabilities go through [SECURITY.md](SECURITY.md).

Licensed under the [Apache License 2.0](LICENSE).
