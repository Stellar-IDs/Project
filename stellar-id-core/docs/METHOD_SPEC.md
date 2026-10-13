# `did:stellar` Method Specification

## Document Status

- **Status:** Phase 1 draft (v0.x) - under active development
- **Method:** `did:stellar`
- **Canonical repository:** [stellar-identity-suite](https://github.com/stellar-id/stellar-identity-suite) (monorepo, split into stellar-id-core, stellar-id-client, stellar-id-frontend, stellar-id-docs)
- **Reference implementation:** `stellar-id-core` (Soroban contract), `stellar-id-client` (TypeScript SDK), `stellar-id-frontend` (React components)
- **Networks:** `testnet` (Phase 1–3), `public` (mainnet, explicit non-goal for v1)
- **Conforms to:** [W3C DID Core 1.1](https://www.w3.org/TR/did-1.1/) (targeting)

---

## ⚠️ Name Conflict Notice

**There is an existing `did:stellar` method registered by ACTA-Team.**

| Property | ACTA-Team (`did:stellar` v0.1) | This Specification |
|---|---|---|
| **Method name** | `did:stellar` | `did:stellar` (same) |
| **Spec status** | Draft v0.1 (2026-07-03), public spec candidate | Phase 1 draft, under active development |
| **Canonical repo** | [ACTA-Team/contracts-acta](https://github.com/ACTA-Team/contracts-acta) | [stellar-id/stellar-identity-suite](https://github.com/stellar-id/stellar-identity-suite) |
| **Reference impl** | `@acta-team/did-stellar` (TS SDK), `did.acta.build` (HTTP resolver) | `stellar-id-core` (Soroban), `stellar-id-client` (TS SDK), `stellar-id-frontend` (React) |
| **Networks** | `mainnet`, `testnet` | `testnet` only (v1), `public` non-goal |
| **DID syntax** | `did:stellar:<network>:<base32-128bit>` | `did:stellar:<network>:<strkey-address>` |

**Key design difference:** ACTA's method uses an **opaque 128-bit identifier** (base32-encoded, 26 chars) as the method-specific ID, stored in a registry contract keyed by that opaque ID. The controller is a separate Stellar account.

**This specification uses the Stellar address (strkey, `G...`) directly as the method-specific ID.** The DID is `did:stellar:<network>:<strkey-address>`. The controller **is** the address. One DID per controlling address. No opaque ID, no separate registry lookup.

This is a deliberate design choice: the Stellar address is already a globally unique, cryptographically verifiable identifier on the network. Adding an opaque layer adds indirection without benefit for our use cases (wallet-native identity, credential issuance by the same address).

**If the W3C DID Method Registry rejects `did:stellar` due to prior registration, this method will be renamed to `did:stellar-id` (or similar) with minimal spec changes.** The document below is written to be rename-friendly - only the method name prefix changes.

---

## 1. Goals and Non-Goals

### 1.1 Goals

- Provide a Stellar-native DID method that maps 1:1 with Stellar addresses (`G...` accounts).
- Enable wallet-native identity: any Stellar account holder can create their DID by signing a transaction.
- Support Verifiable Credentials: issue, anchor, revoke, and verify credentials where the issuer is a `did:stellar` DID.
- Implement a minimal, auditable Soroban contract with bounded storage, explicit limits, and no admin override.
- Provide a TypeScript SDK and React components that hide XDR/Soroban complexity.

### 1.2 Non-Goals (v1)

- Mainnet deployment (testnet only).
- Social login / passkey fallback (wallet-based only; social is a Wave issue).
- Selective disclosure / BBS+ credentials (Ed25519 only).
- DID universal resolver driver (nice later).
- Smart accounts / `C...` contract addresses as controllers (v1: classic `G...` accounts only).
- Historical version traversal (only current state + version number).
- DID URL path/query parameters (canonical DID only).

---

## 2. DID Syntax

### 2.1 Canonical Form

```
did:stellar:<network>:<strkey-address>
```

Where:
- `network` is `testnet` or `public` (lowercase).
- `strkey-address` is a classic Stellar account address (`G...`, base32, 56 chars).

**Examples:**
```
did:stellar:testnet:GABCD...XYZ
did:stellar:public:GBDEF...UVW
```

### 2.2 Validation Regex

```
^did:stellar:(testnet|public):G[A-Z2-7]{55}$
```

### 2.3 Derivation

The method-specific ID is the Stellar account address itself. No opaque ID generation, no separate registry lookup. The DID is derived directly from the controller address.

---

## 3. Contract Data Model

### 3.1 Storage

One persistent entry per DID, keyed by the controller Address.

```rust
#[contracttype]
pub enum DataKey {
    Did(Address),                      // Persistent: DidRecord
    Credential(Address, BytesN<32>),   // Persistent: CredentialRecord (issuer, hash)
}
```

### 3.2 Types

```rust
#[contracttype]
pub struct VerificationMethod {
    pub id: String,              // Fragment, e.g. "key-1" (max 128 bytes)
    pub kind: Symbol,            // "Ed25519" for v1
    pub public_key: BytesN<32>,  // Raw Ed25519 public key
}

#[contracttype]
pub struct Service {
    pub id: String,       // Fragment, e.g. "credential-issuer" (max 128 bytes)
    pub kind: String,     // Service type (max 128 bytes)
    pub endpoint: String, // HTTPS endpoint (max 512 bytes)
}

#[contracttype]
pub struct DidRecord {
    pub controller: Address,                // The Stellar address (G...)
    pub verification_methods: Vec<VerificationMethod>, // All keys
    pub authentication: Vec<String>,        // Fragment IDs (subset of verification_methods)
    pub assertion_method: Vec<String>,      // Fragment IDs (subset)
    pub services: Vec<Service>,
    pub created: u64,       // Ledger timestamp (seconds)
    pub updated: u64,       // Ledger timestamp (seconds)
    pub version: u32,       // Starts at 1, increments on mutation
    pub deactivated: bool,
}
```

### 3.3 Limits (enforced on-chain)

| Field | Limit |
|---|---|
| Verification methods | Max 10 |
| Services | Max 10 |
| `VerificationMethod.id` | Max 128 bytes |
| `VerificationMethod.kind` | `Symbol` (≤ 32 chars, `[a-zA-Z0-9_]` only) |
| `Service.id` | Max 128 bytes |
| `Service.kind` | Max 128 bytes |
| `Service.endpoint` | Max 512 bytes |

Exceeding limits returns `LimitExceeded`.

---

## 4. Contract Operations

### 4.1 ABI

**DID lifecycle**
- `create_did(controller: Address, doc: NewDidDoc) -> Result<(), Error>`
- `resolve(controller: Address) -> Result<DidRecord, Error>` (read-only)
- `add_verification_method(controller, vm: VerificationMethod) -> Result<(), Error>`
- `remove_verification_method(controller, vm_id: String) -> Result<(), Error>`
- `set_relationships(controller, authentication: Vec<String>, assertion_method: Vec<String>) -> Result<(), Error>`
- `add_service(controller, svc: Service) -> Result<(), Error>`
- `remove_service(controller, svc_id: String) -> Result<(), Error>`
- `rotate_controller(controller, new_controller: Address) -> Result<(), Error>` (requires auth from both)
- `deactivate_did(controller) -> Result<(), Error>`
- `bump_ttl(controller) -> Result<(), Error>` (anyone may call)

**Credentials (anchoring + revocation)**
- `anchor_credential(issuer: Address, credential_hash: BytesN<32>, expires_at: Option<u64>) -> Result<(), Error>`
- `revoke_credential(issuer: Address, credential_hash: BytesN<32>) -> Result<(), Error>`
- `credential_status(issuer: Address, credential_hash: BytesN<32>) -> CredentialStatus` (read-only)
- `verify_credential_proof(issuer: Address, vm_id: String, message_hash: BytesN<32>, signature: BytesN<64>) -> Result<(), Error>`

### 4.2 Authorization

Every mutating function calls `controller.require_auth()` first, then checks the stored controller equals the caller. `rotate_controller` requires auth from **both** old and new controllers.

### 4.3 Events

| Event | Payload |
|---|---|
| `did/created` | `controller`, `version` |
| `did/updated` | `controller`, `version` |
| `did/deactivated` | `controller` |
| `did/controller_rotated` | `old_controller`, `new_controller`, `version` |
| `cred/anchored` | `issuer`, `credential_hash`, `expires_at` |
| `cred/revoked` | `issuer`, `credential_hash` |

### 4.4 Errors

`NotFound`, `AlreadyExists`, `Unauthorized`, `Deactivated`, `InvalidVerificationMethod`, `InvalidProof`, `Revoked`, `Expired`, `LimitExceeded`, `InvalidInput`.

---

## 5. DID Document (JSON-LD Rendering)

The client SDK renders a W3C-conformant DID Document from the on-chain `DidRecord`:

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
      "publicKeyMultibase": "z6Mk..."  // Ed25519 multibase encoding
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

- The controller is the DID itself (self-controlled). No `controller` field in the document.
- `publicKeyMultibase` uses multibase base58btc (`z...`) encoding of the raw Ed25519 key.
- Fragment IDs: `key-1`, `key-2`, etc. for verification methods; `credential-issuer`, etc. for services.

---

## 6. Credential Anchoring & Revocation

### 6.1 Canonicalization

The message to be hashed and signed is the **JCS-canonicalized** (RFC 8785) credential JSON, UTF-8 encoded, then SHA-256 hashed.

```
message = JCS(credential_json)
hash = SHA-256(message)
signature = Ed25519_sign(issuer_private_key, hash)
```

The issuer anchors `hash` on-chain via `anchor_credential`. Revocation sets a flag on that hash.

### 6.2 Status

- `Unknown`: no record
- `Active`: anchored, not revoked, not expired
- `Revoked`: explicitly revoked
- `Expired`: `expires_at` passed (ledger timestamp)

### 6.3 Proof Verification

`verify_credential_proof(issuer, vm_id, message_hash, signature)`:
1. Load issuer's DID record.
2. Fail if deactivated.
3. Find `vm_id` in `assertion_method`.
4. `env.crypto().ed25519_verify(pubkey, message_hash, signature)`.
5. **Note:** Soroban's `ed25519_verify` **traps** on invalid signature (does not return false). The function returns `Ok(())` or the transaction fails.

---

## 7. Resolution

The client SDK resolves a DID by:

1. Parse DID → extract network and address.
2. Call `resolve(address)` via RPC simulation (free, no signing).
3. Map `DidRecord` → W3C DID Document (see §5).
4. Return `ResolutionResult` per DID Resolution spec:
   - `didResolutionMetadata`: `{ contentType, error? }`
   - `didDocument`: the JSON-LD document
   - `didDocumentMetadata`: `{ created, updated, versionId, deactivated?, method: { stellarAccount } }`

Deactivated DIDs return a tombstone document (empty keys/services, `deactivated: true`).

---

## 8. Security & Privacy

- **No PII on-chain.** Only keys, hashes, status flags, and service endpoints.
- **Self-controlled:** DID subject = controller address. No `controller` field in document.
- **Ed25519 only.** Keys are 32-byte raw public keys.
- **TTL extension:** Every persistent write extends TTL. `bump_ttl` allows anyone to extend.
- **No admin override:** Contract has no admin that can mutate DIDs.

---

## 9. Test Vectors

Cross-language compatibility vectors (shared with `stellar-id-client`):

```json
{
  "jcs_canonicalization": [
    { "input": {"@context":["https://www.w3.org/ns/credentials/v1"],"id":"http://example.edu/credentials/1","type":["VerifiableCredential"],"issuer":"did:stellar:testnet:GABC...","issuanceDate":"2026-01-01T00:00:00Z","credentialSubject":{"id":"did:stellar:testnet:GDEF...","degree":"Bachelor"}}, "canonical": "...", "sha256": "..." }
  ],
  "ed25519_sign_verify": [
    { "private_key": "...", "message": "...", "signature": "...", "public_key": "...", "valid": true }
  ]
}
```

---

## 10. Deployment (Phase 3)

- Network: Stellar testnet
- Contract ID: recorded in `deployments/testnet.json`
- WASM hash: recorded
- Deployed by: `deployer` identity

---

## 11. Future / Wave Extensions

| Extension | Plug-in point |
|---|---|
| DID method registration (multiple methods/networks) | `// TODO(wave: core-1)` in create/resolve |
| Additional proof types (secp256r1, BBS+) | `VerificationMethod.kind` dispatch in `verify_credential_proof` |
| Batched revocation lists | `credential_status` internals |
| Resource-fee optimization | `storage.rs` baseline |

---

## 12. Rename Contingency

If the method name must change (e.g., to `did:stellar-id`):

1. Replace `did:stellar` with `did:stellar-id` in DID syntax (§2.1), validation regex (§2.2), DID Document `id` field (§5), and all client-facing code.
2. Update the method name in `stellar-id-client` `parseDid`/`formatDid`.
3. Update docs and examples.
4. No contract changes needed (contract is address-based, not method-name-based).

---

## Annex: ACTA-Team Design Comparison

| Aspect | ACTA-Team `did:stellar` | This Spec |
|---|---|---|
| Method-specific ID | Opaque 128-bit (base32, 26 chars) | Stellar address (strkey `G...`, 56 chars) |
| Controller | Separate Stellar account | The address itself (1:1) |
| Registry | Separate contract keyed by opaque ID | Direct address-keyed storage |
| Verification keys | Multikey strings (`z6Mk...`) stored | Raw `BytesN<32>` stored; multibase only at render |
| Verification relationships | `authentication`, `assertionMethod`, `keyAgreement` | `authentication`, `assertionMethod` (no `keyAgreement` in v1) |
| Service limit | 3 | 10 |
| Verification method limit | 3 per relationship | 10 total |
| Controller transfer | `transfer_controller` (outgoing signs) | `rotate_controller` (both sign) |
| Sponsored registration | Yes (`register_sponsored`) | No (v1) |
| DID URL params | None | None |
| DID URL path/query | Not supported | Not supported |
| Admin role | Contract admin (future governance) | None |
| Verifiable Credentials | Issuer anchors hash, revokes | Same |
| Canonicalization | JCS (RFC 8785) | Same |
| Proof format | Ed25519 Multikey | Ed25519 raw (multibase only at render) |
| Specification registry | W3C DID Method Registry (submitted) | Will submit after Phase 1 |

---

*End of specification.*