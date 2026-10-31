---
id: api-contract
title: Contract Methods
sidebar_label: Contract (Soroban)
sidebar_position: 3
---

# Contract API (`stellar-id-core`)

The Soroban contract implements the `did:stellar` DID method on Stellar testnet.

**Deployed:** `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`
**WASM Hash:** `400726ecf5529f2fff8ece0bcf6f7e2411af289f2a4fb5634944f2db51e8e332`
**RPC:** `https://soroban-testnet.stellar.org`

## DID Lifecycle

| Function | Auth | Returns | Events |
|---|---|---|---|
| `create_did(controller, doc)` | `controller` | `()` | `DidCreated` |
| `resolve(controller)` | (read) | `DidRecord` | — |
| `add_verification_method(controller, vm)` | `controller` | `()` | `DidUpdated` |
| `remove_verification_method(controller, vm_id)` | `controller` | `()` | `DidUpdated` |
| `set_relationships(controller, authentication, assertion_method)` | `controller` | `()` | `DidUpdated` |
| `add_service(controller, svc)` | `controller` | `()` | `DidUpdated` |
| `remove_service(controller, svc_id)` | `controller` | `()` | `DidUpdated` |
| `rotate_controller(controller, new_controller)` | **both** | `()` | `DidControllerRotated` |
| `deactivate_did(controller)` | `controller` | `()` | `DidDeactivated` |
| `bump_ttl(controller)` | **none** | `()` | — |

**All mutating functions:**
- Check `controller.require_auth()`
- Verify stored controller matches caller
- Reject if `deactivated == true`
- Bump `updated` timestamp, increment `version`
- Extend TTL on write

## Credentials (Anchoring + Revocation)

| Function | Auth | Returns | Events |
|---|---|---|---|
| `anchor_credential(issuer, hash, expires_at?)` | `issuer` | `()` | `CredentialAnchored` |
| `revoke_credential(issuer, hash)` | `issuer` | `()` | `CredentialRevoked` |
| `credential_status(issuer, hash)` | (read) | `CredentialStatus` | — |

### `CredentialStatus` Enum

```
Unknown  // never anchored
Active   // anchored, not revoked, not expired
Revoked  // explicitly revoked (terminal, beats Expired)
Expired  // ledger timestamp >= expires_at (inclusive)
```

### `verify_credential_proof(issuer, vm_id, message_hash, signature)`

- Loads issuer DID (must exist, not deactivated)
- Finds `vm_id` in `assertion_method`
- Runs `ed25519_verify(pubkey, message_hash, signature)`
- **Trap behaviour**: Soroban's `ed25519_verify` traps (fails the whole
  transaction/simulation) on invalid signature. The function returns `Ok(())`
  on success, a `ContractError` for DID/key problems, or traps for bad sig.

## Events

All state changes emit structured events:

- `did/created` — `{ controller, version }`
- `did/updated` — `{ controller, version }`
- `did/deactivated` — `{ controller }`
- `did/controller_rotated` — `{ old_controller, new_controller, version }`
- `cred/anchored` — `{ issuer, hash, expires_at }`
- `cred/revoked` — `{ issuer, hash }`

## Errors

`ContractError` (u32):

| Code | Name | Meaning |
|---|---|---|
| 1 | `NotFound` | DID or credential not found |
| 2 | `AlreadyExists` | DID exists / hash already anchored |
| 3 | `Unauthorized` | Auth mismatch |
| 4 | `Deactivated` | DID is deactivated |
| 5 | `InvalidVerificationMethod` | Unknown VM or not in relationship |
| 6 | `InvalidProof` | (unused — sig verification traps) |
| 7 | `Revoked` | Credential already revoked |
| 8 | `Expired` | Credential expired |
| 9 | `LimitExceeded` | >10 VMs or services |
| 10 | `InvalidInput` | Bad id/kind/endpoint/length |

## Limits (enforced on-chain)

- Max 10 verification methods per DID
- Max 10 services per DID
- VM id / Service id ≤ 128 bytes
- Service kind ≤ 128 bytes
- Service endpoint ≤ 512 bytes, must be `https://`

---

**Next:** [Security Basics](../security/basics.md)