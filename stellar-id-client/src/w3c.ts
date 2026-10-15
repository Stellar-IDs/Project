/**
 * W3C DID Core JSON-LD rendering of an on-chain `DidRecord`.
 *
 * The contract stores a compact struct (raw 32-byte keys, fragment ids);
 * this module renders the standard JSON-LD document with `@context`,
 * `Multikey` verification methods, and `publicKeyMultibase` values, per
 * `docs/METHOD_SPEC.md` §5 in stellar-id-core.
 */
import baseX from "base-x";
import type { DidRecord } from "./generated/index.js";

/** Base58btc codec (Bitcoin alphabet) used by multibase. */
const BASE58_BTC_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const base58btc = baseX(BASE58_BTC_ALPHABET);

/** Multicodec prefix for Ed25519 public keys (`0xed 0x01`). */
const ED25519_MULTICODEC_PREFIX = Uint8Array.from([0xed, 0x01]);

/**
 * Encode a raw 32-byte Ed25519 public key as `publicKeyMultibase`
 * (`z...` base58btc of multicodec-prefixed key bytes).
 *
 * @param publicKeyHex - 64-char lowercase hex of the raw public key.
 * @returns The multibase string, e.g. `z6Mk...`.
 */
export function publicKeyToMultibase(publicKeyHex: string): string {
  const raw = Buffer.from(publicKeyHex, "hex");
  if (raw.length !== 32) {
    throw new Error(`public key must be 32 bytes, got ${raw.length}`);
  }
  const prefixed = Buffer.concat([Buffer.from(ED25519_MULTICODEC_PREFIX), raw]);
  return `z${base58btc.encode(prefixed)}`;
}

/**
 * Decode a `publicKeyMultibase` value back to raw key hex.
 *
 * @param multibase - A `z...` base58btc multibase string.
 * @returns 64-char lowercase hex of the raw 32-byte public key.
 */
export function multibaseToPublicKeyHex(multibase: string): string {
  if (!multibase.startsWith("z")) {
    throw new Error("multibase value must start with 'z' (base58btc)");
  }
  const bytes = Buffer.from(base58btc.decode(multibase.slice(1)));
  if (
    bytes.length !== 34 ||
    bytes[0] !== ED25519_MULTICODEC_PREFIX[0] ||
    bytes[1] !== ED25519_MULTICODEC_PREFIX[1]
  ) {
    throw new Error("multibase value is not an Ed25519 public key");
  }
  return bytes.subarray(2).toString("hex");
}

/** A `Multikey` verification method entry. */
export interface W3CVerificationMethod {
  /** Fully qualified id: `<did>#<fragment>`. */
  id: string;
  /** Always `"Multikey"` in v1. */
  type: "Multikey";
  /** The DID that controls the key (the DID itself — self-controlled). */
  controller: string;
  /** `z...` base58btc multibase of the multicodec-prefixed raw key. */
  publicKeyMultibase: string;
}

/** A service entry in the rendered document. */
export interface W3CService {
  /** Fully qualified id: `<did>#<fragment>`. */
  id: string;
  /** Service type. */
  type: string;
  /** Service endpoint URL. */
  serviceEndpoint: string;
}

/** W3C DID Core document rendered from an on-chain record. */
export interface DidDocument {
  /** JSON-LD context (DID Core + Multikey). */
  "@context": string[];
  /** The DID itself, e.g. `did:stellar:testnet:GABC...`. */
  id: string;
  /** Verification methods (empty on tombstones). */
  verificationMethod: W3CVerificationMethod[];
  /** Fully qualified authentication references. */
  authentication: string[];
  /** Fully qualified assertionMethod references. */
  assertionMethod: string[];
  /** Service entries. */
  service: W3CService[];
}

/**
 * Render a W3C JSON-LD DID document from an on-chain record.
 *
 * Deactivated DIDs render as tombstones: correct `id`, empty keys,
 * relationships, and services (per METHOD_SPEC §7).
 *
 * @param record - The on-chain `DidRecord` (generated bindings type).
 * @param did - The canonical DID string for `id`/`controller` fields.
 * @returns The JSON-LD document.
 */
export function toW3CDocument(record: DidRecord, did: string): DidDocument {
  if (record.deactivated) {
    return {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: did,
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      service: [],
    };
  }
  const methodsById = new Map(record.verification_methods.map((vm) => [vm.id, vm]));
  const verificationMethod: W3CVerificationMethod[] = record.verification_methods.map((vm) => ({
    id: `${did}#${vm.id}`,
    type: "Multikey",
    controller: did,
    publicKeyMultibase: publicKeyToMultibase(vm.public_key.toString("hex")),
  }));
  const qualify = (fragment: string): string => {
    if (!methodsById.has(fragment)) {
      throw new Error(`relationship references unknown verification method "${fragment}"`);
    }
    return `${did}#${fragment}`;
  };
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/multikey/v1"],
    id: did,
    verificationMethod,
    authentication: record.authentication.map(qualify),
    assertionMethod: record.assertion_method.map(qualify),
    service: record.services.map((svc) => ({
      id: `${did}#${svc.id}`,
      type: svc.kind,
      serviceEndpoint: svc.endpoint,
    })),
  };
}
