import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBFXX2HCWDIQR45XNPLIMADAKO3N2EXMHJWSGNGNMJQR67TKZ4SCTXXE",
  }
} as const







export const ContractError = {
  1: {message:"NotFound"},
  2: {message:"AlreadyExists"},
  3: {message:"Unauthorized"},
  4: {message:"Deactivated"},
  5: {message:"InvalidVerificationMethod"},
  6: {message:"InvalidProof"},
  7: {message:"Revoked"},
  8: {message:"Expired"},
  9: {message:"LimitExceeded"},
  10: {message:"InvalidInput"}
}


export interface Service {
  endpoint: string;
  id: string;
  kind: string;
}


export interface DidRecord {
  assertion_method: Array<string>;
  authentication: Array<string>;
  controller: string;
  created: u64;
  deactivated: boolean;
  services: Array<Service>;
  updated: u64;
  verification_methods: Array<VerificationMethod>;
  version: u32;
}


export interface NewDidDoc {
  assertion_method: Array<string>;
  authentication: Array<string>;
  controller: string;
  services: Array<Service>;
  verification_methods: Array<VerificationMethod>;
}

/**
 * Read-only credential status, returned by `credential_status`.
 * 
 * `Unknown` means no anchor record exists (never anchored).
 * `Revoked` takes precedence over `Expired`: once revoked, a credential
 * stays revoked even after its expiry time passes.
 */
export type CredentialStatus = {tag: "Unknown", values: void} | {tag: "Active", values: void} | {tag: "Revoked", values: void} | {tag: "Expired", values: void};


export interface VerificationMethod {
  id: string;
  kind: string;
  public_key: Buffer;
}

export interface Client {
  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve: ({controller}: {controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<DidRecord>>>

  /**
   * Construct and simulate a bump_ttl transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Extend a DID record's time-to-live without changing it.
   * 
   * Anyone may call (no authorization — the caller pays the rent for the
   * extension). Returns `NotFound` for a missing DID. Works on
   * deactivated DIDs so tombstones stay resolvable. Emits no event and
   * changes no state; TTL mechanics are documented in
   * `docs/METHOD_SPEC.md` §8.
   */
  bump_ttl: ({controller}: {controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_did transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_did: ({controller, doc}: {controller: string, doc: NewDidDoc}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a add_service transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a service endpoint to a DID.
   * 
   * Requires authorization from `controller`. The service id must be
   * unique within the DID (max 128 bytes), the kind at most 128 bytes,
   * and the endpoint an `https://` URL of at most 512 bytes. At most 10
   * services per DID (`LimitExceeded`). Bumps `updated`/`version` and
   * emits a `did/updated` event.
   */
  add_service: ({controller, svc}: {controller: string, svc: Service}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a deactivate_did transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deactivate a DID (terminal).
   * 
   * Requires authorization from `controller`. Sets the `deactivated`
   * flag; afterwards every mutating operation on the DID (updates,
   * rotation, anchoring) fails with `Deactivated`, while `resolve`,
   * `credential_status` and `revoke_credential` keep working so existing
   * credentials can be wound down. `resolve` still returns the record so
   * verifiers can distinguish "deactivated" from "never existed".
   * Bumps `updated`/`version` and emits a `did/deactivated` event.
   * Deactivating twice returns `Deactivated`.
   */
  deactivate_did: ({controller}: {controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a remove_service transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove a service endpoint from a DID.
   * 
   * Requires authorization from `controller`. Returns `NotFound` for an
   * unknown service id. Bumps `updated`/`version` and emits a
   * `did/updated` event.
   */
  remove_service: ({controller, svc_id}: {controller: string, svc_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a anchor_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anchor a credential hash on-chain.
   * 
   * Stores the SHA-256 hash of the JCS-canonicalized credential JSON
   * (see `docs/METHOD_SPEC.md` §6) with an optional expiry timestamp.
   * The credential contents themselves stay off-chain — never any PII
   * on-chain.
   * 
   * Requires authorization from `issuer`, who must own a non-deactivated
   * DID. Returns `AlreadyExists` if this `(issuer, hash)` pair was
   * already anchored — a revoked credential can never be re-anchored.
   * Emits a `cred/anchored` event.
   */
  anchor_credential: ({issuer, credential_hash, expires_at}: {issuer: string, credential_hash: Buffer, expires_at: Option<u64>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a credential_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  credential_status: ({issuer, credential_hash}: {issuer: string, credential_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<CredentialStatus>>

  /**
   * Construct and simulate a revoke_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke a previously anchored credential.
   * 
   * Requires authorization from `issuer` (the address that anchored the
   * hash). Revocation is terminal: the record stays stored with the
   * revoked flag set, so `credential_status` keeps reporting `Revoked`
   * and the hash can never be re-anchored. Emits a `cred/revoked` event.
   */
  revoke_credential: ({issuer, credential_hash}: {issuer: string, credential_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a rotate_controller transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Rotate a DID to a new controller (both sides consent).
   * 
   * Requires authorization from **both** `controller` and `new_controller`.
   * The record moves from the old key to the new one: `resolve(old)`
   * returns `NotFound` afterwards, `resolve(new)` returns the record with
   * `controller == new` and history (keys, services, version chain)
   * intact. Rotating to self (`InvalidInput`), to an address that already
   * owns a DID (`AlreadyExists`), or from a deactivated DID
   * (`Deactivated`) all fail. Emits a `did/controller_rotated` event.
   * 
   * Note: credentials anchored under the old address stay keyed by it.
   * Rotation effectively starts a new DID identity — re-anchor any
   * credentials that must remain verifiable under the new controller.
   */
  rotate_controller: ({controller, new_controller}: {controller: string, new_controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_relationships transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Replace the `authentication` and `assertion_method` relationship lists.
   * 
   * Requires authorization from `controller`. Every id in both lists must
   * reference an existing verification method, otherwise
   * `InvalidVerificationMethod`. Both lists are replaced wholesale (pass
   * the current list back with edits to add or drop a single entry).
   * Bumps `updated`/`version` and emits a `did/updated` event.
   */
  set_relationships: ({controller, authentication, assertion_method}: {controller: string, authentication: Array<string>, assertion_method: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a add_verification_method transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a verification method to a DID.
   * 
   * Requires authorization from `controller`. The method id must be
   * unique within the DID, at most 128 bytes, and the kind must be
   * `Ed25519` (v1). At most 10 methods per DID (`LimitExceeded`).
   * Bumps `updated`/`version` and emits a `did/updated` event.
   */
  add_verification_method: ({controller, vm}: {controller: string, vm: VerificationMethod}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a verify_credential_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return the on-chain status of a credential hash (read-only, no auth).
   * 
   * - `Unknown`: never anchored under this `(issuer, hash)` pair.
   * - `Active`: anchored, not revoked, not expired.
   * - `Revoked`: explicitly revoked (terminal, takes precedence over expiry).
   * - `Expired`: past `expires_at` per the current ledger timestamp.
   * Verify an Ed25519 credential proof against the issuer's DID.
   * 
   * Loads the issuer's DID (must exist and not be deactivated), finds
   * `vm_id` in the DID's `assertion_method` relationship, and runs
   * Ed25519 signature verification of `signature` over `message_hash`
   * with that verification method's public key. `message_hash` is the
   * SHA-256 of the JCS-canonicalized credential JSON (see
   * `docs/METHOD_SPEC.md` §6).
   * 
   * **Trap behaviour:** Soroban's `env.crypto().ed25519_verify` traps
   * (fails the whole transaction or simulation) on an invalid signature
   * instead of returning false. This function therefore returns `Ok(())`
   * on success, a `ContractError` for DID/key problems (`NotFound`,
   * `Deactivated`, `InvalidVerifica
   */
  verify_credential_proof: ({issuer, vm_id, message_hash, signature}: {issuer: string, vm_id: string, message_hash: Buffer, signature: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a remove_verification_method transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove a verification method from a DID.
   * 
   * Requires authorization from `controller`. Returns `NotFound` for an
   * unknown method id. A method still referenced by `authentication` or
   * `assertion_method` cannot be removed (`InvalidVerificationMethod` —
   * call `set_relationships` first). Bumps `updated`/`version` and emits
   * a `did/updated` event.
   */
  remove_verification_method: ({controller, vm_id}: {controller: string, vm_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAACkRpZENyZWF0ZWQAAAAAAAEAAAALZGlkX2NyZWF0ZWQAAAAAAgAAAAAAAAAKY29udHJvbGxlcgAAAAAAEwAAAAAAAAAAAAAAB3ZlcnNpb24AAAAABAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAACkRpZFVwZGF0ZWQAAAAAAAEAAAALZGlkX3VwZGF0ZWQAAAAAAgAAAAAAAAAKY29udHJvbGxlcgAAAAAAEwAAAAAAAAAAAAAAB3ZlcnNpb24AAAAABAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADkRpZERlYWN0aXZhdGVkAAAAAAABAAAAD2RpZF9kZWFjdGl2YXRlZAAAAAABAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEUNyZWRlbnRpYWxSZXZva2VkAAAAAAAAAQAAABJjcmVkZW50aWFsX3Jldm9rZWQAAAAAAAIAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAAAAAAAAAAABGhhc2gAAAPuAAAAIAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAEkNyZWRlbnRpYWxBbmNob3JlZAAAAAAAAQAAABNjcmVkZW50aWFsX2FuY2hvcmVkAAAAAAMAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAAAAAAAAAAABGhhc2gAAAPuAAAAIAAAAAAAAAAAAAAACmV4cGlyZXNfYXQAAAAAA+gAAAAGAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAFERpZENvbnRyb2xsZXJSb3RhdGVkAAAAAQAAABZkaWRfY29udHJvbGxlcl9yb3RhdGVkAAAAAAADAAAAAAAAAA5vbGRfY29udHJvbGxlcgAAAAAAEwAAAAAAAAAAAAAADm5ld19jb250cm9sbGVyAAAAAAATAAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAEAAAAAAAAAAI=",
        "AAAAAAAAAAAAAAAHcmVzb2x2ZQAAAAABAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAQAAA+kAAAfQAAAACURpZFJlY29yZAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAUpFeHRlbmQgYSBESUQgcmVjb3JkJ3MgdGltZS10by1saXZlIHdpdGhvdXQgY2hhbmdpbmcgaXQuCgpBbnlvbmUgbWF5IGNhbGwgKG5vIGF1dGhvcml6YXRpb24g4oCUIHRoZSBjYWxsZXIgcGF5cyB0aGUgcmVudCBmb3IgdGhlCmV4dGVuc2lvbikuIFJldHVybnMgYE5vdEZvdW5kYCBmb3IgYSBtaXNzaW5nIERJRC4gV29ya3Mgb24KZGVhY3RpdmF0ZWQgRElEcyBzbyB0b21ic3RvbmVzIHN0YXkgcmVzb2x2YWJsZS4gRW1pdHMgbm8gZXZlbnQgYW5kCmNoYW5nZXMgbm8gc3RhdGU7IFRUTCBtZWNoYW5pY3MgYXJlIGRvY3VtZW50ZWQgaW4KYGRvY3MvTUVUSE9EX1NQRUMubWRgIMKnOC4AAAAAAAhidW1wX3R0bAAAAAEAAAAAAAAACmNvbnRyb2xsZXIAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKY3JlYXRlX2RpZAAAAAAAAgAAAAAAAAAKY29udHJvbGxlcgAAAAAAEwAAAAAAAAADZG9jAAAAB9AAAAAJTmV3RGlkRG9jAAAAAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAUhBZGQgYSBzZXJ2aWNlIGVuZHBvaW50IHRvIGEgRElELgoKUmVxdWlyZXMgYXV0aG9yaXphdGlvbiBmcm9tIGBjb250cm9sbGVyYC4gVGhlIHNlcnZpY2UgaWQgbXVzdCBiZQp1bmlxdWUgd2l0aGluIHRoZSBESUQgKG1heCAxMjggYnl0ZXMpLCB0aGUga2luZCBhdCBtb3N0IDEyOCBieXRlcywKYW5kIHRoZSBlbmRwb2ludCBhbiBgaHR0cHM6Ly9gIFVSTCBvZiBhdCBtb3N0IDUxMiBieXRlcy4gQXQgbW9zdCAxMApzZXJ2aWNlcyBwZXIgRElEIChgTGltaXRFeGNlZWRlZGApLiBCdW1wcyBgdXBkYXRlZGAvYHZlcnNpb25gIGFuZAplbWl0cyBhIGBkaWQvdXBkYXRlZGAgZXZlbnQuAAAAC2FkZF9zZXJ2aWNlAAAAAAIAAAAAAAAACmNvbnRyb2xsZXIAAAAAABMAAAAAAAAAA3N2YwAAAAfQAAAAB1NlcnZpY2UAAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAg5EZWFjdGl2YXRlIGEgRElEICh0ZXJtaW5hbCkuCgpSZXF1aXJlcyBhdXRob3JpemF0aW9uIGZyb20gYGNvbnRyb2xsZXJgLiBTZXRzIHRoZSBgZGVhY3RpdmF0ZWRgCmZsYWc7IGFmdGVyd2FyZHMgZXZlcnkgbXV0YXRpbmcgb3BlcmF0aW9uIG9uIHRoZSBESUQgKHVwZGF0ZXMsCnJvdGF0aW9uLCBhbmNob3JpbmcpIGZhaWxzIHdpdGggYERlYWN0aXZhdGVkYCwgd2hpbGUgYHJlc29sdmVgLApgY3JlZGVudGlhbF9zdGF0dXNgIGFuZCBgcmV2b2tlX2NyZWRlbnRpYWxgIGtlZXAgd29ya2luZyBzbyBleGlzdGluZwpjcmVkZW50aWFscyBjYW4gYmUgd291bmQgZG93bi4gYHJlc29sdmVgIHN0aWxsIHJldHVybnMgdGhlIHJlY29yZCBzbwp2ZXJpZmllcnMgY2FuIGRpc3Rpbmd1aXNoICJkZWFjdGl2YXRlZCIgZnJvbSAibmV2ZXIgZXhpc3RlZCIuCkJ1bXBzIGB1cGRhdGVkYC9gdmVyc2lvbmAgYW5kIGVtaXRzIGEgYGRpZC9kZWFjdGl2YXRlZGAgZXZlbnQuCkRlYWN0aXZhdGluZyB0d2ljZSByZXR1cm5zIGBEZWFjdGl2YXRlZGAuAAAAAAAOZGVhY3RpdmF0ZV9kaWQAAAAAAAEAAAAAAAAACmNvbnRyb2xsZXIAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAALlSZW1vdmUgYSBzZXJ2aWNlIGVuZHBvaW50IGZyb20gYSBESUQuCgpSZXF1aXJlcyBhdXRob3JpemF0aW9uIGZyb20gYGNvbnRyb2xsZXJgLiBSZXR1cm5zIGBOb3RGb3VuZGAgZm9yIGFuCnVua25vd24gc2VydmljZSBpZC4gQnVtcHMgYHVwZGF0ZWRgL2B2ZXJzaW9uYCBhbmQgZW1pdHMgYQpgZGlkL3VwZGF0ZWRgIGV2ZW50LgAAAAAAAA5yZW1vdmVfc2VydmljZQAAAAAAAgAAAAAAAAAKY29udHJvbGxlcgAAAAAAEwAAAAAAAAAGc3ZjX2lkAAAAAAAQAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAd1BbmNob3IgYSBjcmVkZW50aWFsIGhhc2ggb24tY2hhaW4uCgpTdG9yZXMgdGhlIFNIQS0yNTYgaGFzaCBvZiB0aGUgSkNTLWNhbm9uaWNhbGl6ZWQgY3JlZGVudGlhbCBKU09OCihzZWUgYGRvY3MvTUVUSE9EX1NQRUMubWRgIMKnNikgd2l0aCBhbiBvcHRpb25hbCBleHBpcnkgdGltZXN0YW1wLgpUaGUgY3JlZGVudGlhbCBjb250ZW50cyB0aGVtc2VsdmVzIHN0YXkgb2ZmLWNoYWluIOKAlCBuZXZlciBhbnkgUElJCm9uLWNoYWluLgoKUmVxdWlyZXMgYXV0aG9yaXphdGlvbiBmcm9tIGBpc3N1ZXJgLCB3aG8gbXVzdCBvd24gYSBub24tZGVhY3RpdmF0ZWQKRElELiBSZXR1cm5zIGBBbHJlYWR5RXhpc3RzYCBpZiB0aGlzIGAoaXNzdWVyLCBoYXNoKWAgcGFpciB3YXMKYWxyZWFkeSBhbmNob3JlZCDigJQgYSByZXZva2VkIGNyZWRlbnRpYWwgY2FuIG5ldmVyIGJlIHJlLWFuY2hvcmVkLgpFbWl0cyBhIGBjcmVkL2FuY2hvcmVkYCBldmVudC4AAAAAAAARYW5jaG9yX2NyZWRlbnRpYWwAAAAAAAADAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfaGFzaAAAAAPuAAAAIAAAAAAAAAAKZXhwaXJlc19hdAAAAAAD6AAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAARY3JlZGVudGlhbF9zdGF0dXMAAAAAAAACAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfaGFzaAAAAAPuAAAAIAAAAAEAAAfQAAAAEENyZWRlbnRpYWxTdGF0dXM=",
        "AAAAAAAAATVSZXZva2UgYSBwcmV2aW91c2x5IGFuY2hvcmVkIGNyZWRlbnRpYWwuCgpSZXF1aXJlcyBhdXRob3JpemF0aW9uIGZyb20gYGlzc3VlcmAgKHRoZSBhZGRyZXNzIHRoYXQgYW5jaG9yZWQgdGhlCmhhc2gpLiBSZXZvY2F0aW9uIGlzIHRlcm1pbmFsOiB0aGUgcmVjb3JkIHN0YXlzIHN0b3JlZCB3aXRoIHRoZQpyZXZva2VkIGZsYWcgc2V0LCBzbyBgY3JlZGVudGlhbF9zdGF0dXNgIGtlZXBzIHJlcG9ydGluZyBgUmV2b2tlZGAKYW5kIHRoZSBoYXNoIGNhbiBuZXZlciBiZSByZS1hbmNob3JlZC4gRW1pdHMgYSBgY3JlZC9yZXZva2VkYCBldmVudC4AAAAAAAARcmV2b2tlX2NyZWRlbnRpYWwAAAAAAAACAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfaGFzaAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAs1Sb3RhdGUgYSBESUQgdG8gYSBuZXcgY29udHJvbGxlciAoYm90aCBzaWRlcyBjb25zZW50KS4KClJlcXVpcmVzIGF1dGhvcml6YXRpb24gZnJvbSAqKmJvdGgqKiBgY29udHJvbGxlcmAgYW5kIGBuZXdfY29udHJvbGxlcmAuClRoZSByZWNvcmQgbW92ZXMgZnJvbSB0aGUgb2xkIGtleSB0byB0aGUgbmV3IG9uZTogYHJlc29sdmUob2xkKWAKcmV0dXJucyBgTm90Rm91bmRgIGFmdGVyd2FyZHMsIGByZXNvbHZlKG5ldylgIHJldHVybnMgdGhlIHJlY29yZCB3aXRoCmBjb250cm9sbGVyID09IG5ld2AgYW5kIGhpc3RvcnkgKGtleXMsIHNlcnZpY2VzLCB2ZXJzaW9uIGNoYWluKQppbnRhY3QuIFJvdGF0aW5nIHRvIHNlbGYgKGBJbnZhbGlkSW5wdXRgKSwgdG8gYW4gYWRkcmVzcyB0aGF0IGFscmVhZHkKb3ducyBhIERJRCAoYEFscmVhZHlFeGlzdHNgKSwgb3IgZnJvbSBhIGRlYWN0aXZhdGVkIERJRAooYERlYWN0aXZhdGVkYCkgYWxsIGZhaWwuIEVtaXRzIGEgYGRpZC9jb250cm9sbGVyX3JvdGF0ZWRgIGV2ZW50LgoKTm90ZTogY3JlZGVudGlhbHMgYW5jaG9yZWQgdW5kZXIgdGhlIG9sZCBhZGRyZXNzIHN0YXkga2V5ZWQgYnkgaXQuClJvdGF0aW9uIGVmZmVjdGl2ZWx5IHN0YXJ0cyBhIG5ldyBESUQgaWRlbnRpdHkg4oCUIHJlLWFuY2hvciBhbnkKY3JlZGVudGlhbHMgdGhhdCBtdXN0IHJlbWFpbiB2ZXJpZmlhYmxlIHVuZGVyIHRoZSBuZXcgY29udHJvbGxlci4AAAAAAAARcm90YXRlX2NvbnRyb2xsZXIAAAAAAAACAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAA5uZXdfY29udHJvbGxlcgAAAAAAEwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAYRSZXBsYWNlIHRoZSBgYXV0aGVudGljYXRpb25gIGFuZCBgYXNzZXJ0aW9uX21ldGhvZGAgcmVsYXRpb25zaGlwIGxpc3RzLgoKUmVxdWlyZXMgYXV0aG9yaXphdGlvbiBmcm9tIGBjb250cm9sbGVyYC4gRXZlcnkgaWQgaW4gYm90aCBsaXN0cyBtdXN0CnJlZmVyZW5jZSBhbiBleGlzdGluZyB2ZXJpZmljYXRpb24gbWV0aG9kLCBvdGhlcndpc2UKYEludmFsaWRWZXJpZmljYXRpb25NZXRob2RgLiBCb3RoIGxpc3RzIGFyZSByZXBsYWNlZCB3aG9sZXNhbGUgKHBhc3MKdGhlIGN1cnJlbnQgbGlzdCBiYWNrIHdpdGggZWRpdHMgdG8gYWRkIG9yIGRyb3AgYSBzaW5nbGUgZW50cnkpLgpCdW1wcyBgdXBkYXRlZGAvYHZlcnNpb25gIGFuZCBlbWl0cyBhIGBkaWQvdXBkYXRlZGAgZXZlbnQuAAAAEXNldF9yZWxhdGlvbnNoaXBzAAAAAAAAAwAAAAAAAAAKY29udHJvbGxlcgAAAAAAEwAAAAAAAAAOYXV0aGVudGljYXRpb24AAAAAA+oAAAAQAAAAAAAAABBhc3NlcnRpb25fbWV0aG9kAAAD6gAAABAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAARxBZGQgYSB2ZXJpZmljYXRpb24gbWV0aG9kIHRvIGEgRElELgoKUmVxdWlyZXMgYXV0aG9yaXphdGlvbiBmcm9tIGBjb250cm9sbGVyYC4gVGhlIG1ldGhvZCBpZCBtdXN0IGJlCnVuaXF1ZSB3aXRoaW4gdGhlIERJRCwgYXQgbW9zdCAxMjggYnl0ZXMsIGFuZCB0aGUga2luZCBtdXN0IGJlCmBFZDI1NTE5YCAodjEpLiBBdCBtb3N0IDEwIG1ldGhvZHMgcGVyIERJRCAoYExpbWl0RXhjZWVkZWRgKS4KQnVtcHMgYHVwZGF0ZWRgL2B2ZXJzaW9uYCBhbmQgZW1pdHMgYSBgZGlkL3VwZGF0ZWRgIGV2ZW50LgAAABdhZGRfdmVyaWZpY2F0aW9uX21ldGhvZAAAAAACAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAAJ2bQAAAAAH0AAAABJWZXJpZmljYXRpb25NZXRob2QAAAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAABABSZXR1cm4gdGhlIG9uLWNoYWluIHN0YXR1cyBvZiBhIGNyZWRlbnRpYWwgaGFzaCAocmVhZC1vbmx5LCBubyBhdXRoKS4KCi0gYFVua25vd25gOiBuZXZlciBhbmNob3JlZCB1bmRlciB0aGlzIGAoaXNzdWVyLCBoYXNoKWAgcGFpci4KLSBgQWN0aXZlYDogYW5jaG9yZWQsIG5vdCByZXZva2VkLCBub3QgZXhwaXJlZC4KLSBgUmV2b2tlZGA6IGV4cGxpY2l0bHkgcmV2b2tlZCAodGVybWluYWwsIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBleHBpcnkpLgotIGBFeHBpcmVkYDogcGFzdCBgZXhwaXJlc19hdGAgcGVyIHRoZSBjdXJyZW50IGxlZGdlciB0aW1lc3RhbXAuClZlcmlmeSBhbiBFZDI1NTE5IGNyZWRlbnRpYWwgcHJvb2YgYWdhaW5zdCB0aGUgaXNzdWVyJ3MgRElELgoKTG9hZHMgdGhlIGlzc3VlcidzIERJRCAobXVzdCBleGlzdCBhbmQgbm90IGJlIGRlYWN0aXZhdGVkKSwgZmluZHMKYHZtX2lkYCBpbiB0aGUgRElEJ3MgYGFzc2VydGlvbl9tZXRob2RgIHJlbGF0aW9uc2hpcCwgYW5kIHJ1bnMKRWQyNTUxOSBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIG9mIGBzaWduYXR1cmVgIG92ZXIgYG1lc3NhZ2VfaGFzaGAKd2l0aCB0aGF0IHZlcmlmaWNhdGlvbiBtZXRob2QncyBwdWJsaWMga2V5LiBgbWVzc2FnZV9oYXNoYCBpcyB0aGUKU0hBLTI1NiBvZiB0aGUgSkNTLWNhbm9uaWNhbGl6ZWQgY3JlZGVudGlhbCBKU09OIChzZWUKYGRvY3MvTUVUSE9EX1NQRUMubWRgIMKnNikuCgoqKlRyYXAgYmVoYXZpb3VyOioqIFNvcm9iYW4ncyBgZW52LmNyeXB0bygpLmVkMjU1MTlfdmVyaWZ5YCB0cmFwcwooZmFpbHMgdGhlIHdob2xlIHRyYW5zYWN0aW9uIG9yIHNpbXVsYXRpb24pIG9uIGFuIGludmFsaWQgc2lnbmF0dXJlCmluc3RlYWQgb2YgcmV0dXJuaW5nIGZhbHNlLiBUaGlzIGZ1bmN0aW9uIHRoZXJlZm9yZSByZXR1cm5zIGBPaygoKSlgCm9uIHN1Y2Nlc3MsIGEgYENvbnRyYWN0RXJyb3JgIGZvciBESUQva2V5IHByb2JsZW1zIChgTm90Rm91bmRgLApgRGVhY3RpdmF0ZWRgLCBgSW52YWxpZFZlcmlmaWNhAAAAF3ZlcmlmeV9jcmVkZW50aWFsX3Byb29mAAAAAAQAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAAAAAAFdm1faWQAAAAAAAAQAAAAAAAAAAxtZXNzYWdlX2hhc2gAAAPuAAAAIAAAAAAAAAAJc2lnbmF0dXJlAAAAAAAD7gAAAEAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAVNSZW1vdmUgYSB2ZXJpZmljYXRpb24gbWV0aG9kIGZyb20gYSBESUQuCgpSZXF1aXJlcyBhdXRob3JpemF0aW9uIGZyb20gYGNvbnRyb2xsZXJgLiBSZXR1cm5zIGBOb3RGb3VuZGAgZm9yIGFuCnVua25vd24gbWV0aG9kIGlkLiBBIG1ldGhvZCBzdGlsbCByZWZlcmVuY2VkIGJ5IGBhdXRoZW50aWNhdGlvbmAgb3IKYGFzc2VydGlvbl9tZXRob2RgIGNhbm5vdCBiZSByZW1vdmVkIChgSW52YWxpZFZlcmlmaWNhdGlvbk1ldGhvZGAg4oCUCmNhbGwgYHNldF9yZWxhdGlvbnNoaXBzYCBmaXJzdCkuIEJ1bXBzIGB1cGRhdGVkYC9gdmVyc2lvbmAgYW5kIGVtaXRzCmEgYGRpZC91cGRhdGVkYCBldmVudC4AAAAAGnJlbW92ZV92ZXJpZmljYXRpb25fbWV0aG9kAAAAAAACAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAAV2bV9pZAAAAAAAABAAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAKAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADUFscmVhZHlFeGlzdHMAAAAAAAACAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAADAAAAAAAAAAtEZWFjdGl2YXRlZAAAAAAEAAAAAAAAABlJbnZhbGlkVmVyaWZpY2F0aW9uTWV0aG9kAAAAAAAABQAAAAAAAAAMSW52YWxpZFByb29mAAAABgAAAAAAAAAHUmV2b2tlZAAAAAAHAAAAAAAAAAdFeHBpcmVkAAAAAAgAAAAAAAAADUxpbWl0RXhjZWVkZWQAAAAAAAAJAAAAAAAAAAxJbnZhbGlkSW5wdXQAAAAK",
        "AAAAAQAAAAAAAAAAAAAAB1NlcnZpY2UAAAAAAwAAAAAAAAAIZW5kcG9pbnQAAAAQAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAEa2luZAAAABA=",
        "AAAAAQAAAAAAAAAAAAAACURpZFJlY29yZAAAAAAAAAkAAAAAAAAAEGFzc2VydGlvbl9tZXRob2QAAAPqAAAAEAAAAAAAAAAOYXV0aGVudGljYXRpb24AAAAAA+oAAAAQAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAAdjcmVhdGVkAAAAAAYAAAAAAAAAC2RlYWN0aXZhdGVkAAAAAAEAAAAAAAAACHNlcnZpY2VzAAAD6gAAB9AAAAAHU2VydmljZQAAAAAAAAAAB3VwZGF0ZWQAAAAABgAAAAAAAAAUdmVyaWZpY2F0aW9uX21ldGhvZHMAAAPqAAAH0AAAABJWZXJpZmljYXRpb25NZXRob2QAAAAAAAAAAAAHdmVyc2lvbgAAAAAE",
        "AAAAAQAAAAAAAAAAAAAACU5ld0RpZERvYwAAAAAAAAUAAAAAAAAAEGFzc2VydGlvbl9tZXRob2QAAAPqAAAAEAAAAAAAAAAOYXV0aGVudGljYXRpb24AAAAAA+oAAAAQAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAAhzZXJ2aWNlcwAAA+oAAAfQAAAAB1NlcnZpY2UAAAAAAAAAABR2ZXJpZmljYXRpb25fbWV0aG9kcwAAA+oAAAfQAAAAElZlcmlmaWNhdGlvbk1ldGhvZAAA",
        "AAAAAgAAAO9SZWFkLW9ubHkgY3JlZGVudGlhbCBzdGF0dXMsIHJldHVybmVkIGJ5IGBjcmVkZW50aWFsX3N0YXR1c2AuCgpgVW5rbm93bmAgbWVhbnMgbm8gYW5jaG9yIHJlY29yZCBleGlzdHMgKG5ldmVyIGFuY2hvcmVkKS4KYFJldm9rZWRgIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBgRXhwaXJlZGA6IG9uY2UgcmV2b2tlZCwgYSBjcmVkZW50aWFsCnN0YXlzIHJldm9rZWQgZXZlbiBhZnRlciBpdHMgZXhwaXJ5IHRpbWUgcGFzc2VzLgAAAAAAAAAAEENyZWRlbnRpYWxTdGF0dXMAAAAEAAAAAAAAAAAAAAAHVW5rbm93bgAAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAAB1Jldm9rZWQAAAAAAAAAAAAAAAAHRXhwaXJlZAA=",
        "AAAAAQAAAAAAAAAAAAAAElZlcmlmaWNhdGlvbk1ldGhvZAAAAAAAAwAAAAAAAAACaWQAAAAAABAAAAAAAAAABGtpbmQAAAARAAAAAAAAAApwdWJsaWNfa2V5AAAAAAPuAAAAIA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    resolve: this.txFromJSON<Result<DidRecord>>,
        bump_ttl: this.txFromJSON<Result<void>>,
        create_did: this.txFromJSON<Result<void>>,
        add_service: this.txFromJSON<Result<void>>,
        deactivate_did: this.txFromJSON<Result<void>>,
        remove_service: this.txFromJSON<Result<void>>,
        anchor_credential: this.txFromJSON<Result<void>>,
        credential_status: this.txFromJSON<CredentialStatus>,
        revoke_credential: this.txFromJSON<Result<void>>,
        rotate_controller: this.txFromJSON<Result<void>>,
        set_relationships: this.txFromJSON<Result<void>>,
        add_verification_method: this.txFromJSON<Result<void>>,
        verify_credential_proof: this.txFromJSON<Result<void>>,
        remove_verification_method: this.txFromJSON<Result<void>>
  }
}