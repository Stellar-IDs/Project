/**
 * Verifiable credentials: issue, verify, revoke.
 *
 * v1 model (see `docs/METHOD_SPEC.md` §6 in stellar-id-core): the
 * credential JSON lives off-chain; the issuer signs the SHA-256 hash of
 * the JCS-canonicalized JSON with an Ed25519 key listed in their DID's
 * `assertionMethod`, and optionally anchors the hash on-chain for
 * revocation/expiry status. Verification is: parse → resolve issuer →
 * check key membership → verify signature locally → check on-chain status.
 */
import { Keypair, StrKey, hash } from "@stellar/stellar-sdk";
import { parseDid } from "./did.js";
import {
  CredentialExpiredError,
  CredentialRevokedError,
  InvalidProofError,
  WalletError,
} from "./errors.js";
import { buildClient, mapCallError, submitMutation } from "./gateway.js";
import type { SubmitOptions } from "./gateway.js";
import type { NetworkConfig } from "./networks.js";
import { testnetConfig } from "./networks.js";
import type { DidReader } from "./resolver.js";
import { createDidReader } from "./resolver.js";
import type { Signer } from "./signers.js";
import type { CredentialStatus } from "./generated/index.js";

/**
 * Canonicalize a JSON value per JCS (RFC 8785) subset: objects with
 * lexicographically sorted keys, arrays in order, no whitespace.
 *
 * Numbers must be finite (non-finite values throw — `JSON.stringify`
 * would silently emit `null`). Full JCS corner cases (e.g. `-0`,
 * exotic numerics) are out of scope for v1; issued credentials use
 * plain strings, integers, booleans, null, arrays, and objects.
 *
 * @param value - The value to canonicalize.
 * @returns The canonical UTF-8 string.
 */
export function canonicalize(value: unknown): string {
  if (value === null) {
    return "null";
  }
  const t = typeof value;
  if (t === "boolean") {
    return value === true ? "true" : "false";
  }
  if (t === "number") {
    if (!Number.isFinite(value as number)) {
      throw new InvalidProofError("credential contains a non-finite number");
    }
    return JSON.stringify(value) as string;
  }
  if (t === "string") {
    return JSON.stringify(value) as string;
  }
  if (Array.isArray(value)) {
    return `[${(value as unknown[]).map((v) => canonicalize(v)).join(",")}]`;
  }
  if (t === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
  }
  throw new InvalidProofError(`credential contains an unserializable ${t}`);
}

/**
 * SHA-256 hex digest of a UTF-8 string.
 *
 * @param text - Input text.
 * @returns 64-char lowercase hex digest.
 */
export function sha256Hex(text: string): string {
  return hash(Buffer.from(text, "utf8")).toString("hex");
}

/** Proof embedded in an issued credential (v1-local format). */
export interface CredentialProof {
  /** Always `"StellarEd25519Proof"` in v1. */
  type: "StellarEd25519Proof";
  /** Signing key reference, `<issuer-did>#<key-fragment>`. */
  verificationMethod: string;
  /** 128-char hex Ed25519 signature over the canonical-hash bytes. */
  signatureHex: string;
}

/** A verifiable credential with embedded proof (contents stay off-chain). */
export interface VerifiableCredential {
  /** JSON-LD context. */
  "@context": string[];
  /** Credential id (URI). */
  id: string;
  /** Credential types. */
  type: string[];
  /** Issuer DID (`did:stellar:...`). */
  issuer: string;
  /** Issuance timestamp (ISO 8601). */
  issuanceDate: string;
  /** Expiry timestamp (ISO 8601), if any. */
  expirationDate?: string;
  /** Claims about the subject. */
  credentialSubject: Record<string, unknown>;
  /** Issuer proof. */
  proof: CredentialProof;
}

/** Options for {@link issueCredential}. */
export interface IssueCredentialOptions {
  /** Issuer signer (must control an on-chain DID for anchoring). */
  issuerSigner: Signer;
  /** Key fragment to sign with (default `"key-1"`). */
  issuerKeyId?: string;
  /** Claims about the subject (must include an `id` for the subject DID). */
  credentialSubject: Record<string, unknown>;
  /** Credential id (URI). Defaults to a `urn:uuid:...` value. */
  id?: string;
  /** Extra credential types beyond `VerifiableCredential`. */
  type?: string[];
  /** Optional expiry (ISO 8601). */
  expirationDate?: string;
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Anchor the hash on-chain (enables revocation/expiry status). */
  anchor?: {
    /** On-chain expiry as unix seconds (mapped to `expires_at`). */
    expiresAt?: number | bigint;
    /** Resilience options. */
    submit?: SubmitOptions;
  };
  /** Resilience options for anchoring. */
  submit?: SubmitOptions;
}

/** An issued credential with its hash and optional anchor transaction. */
export interface IssuedCredential {
  /** The credential including its proof. */
  credential: VerifiableCredential;
  /** SHA-256 hex of the canonical credential JSON (pre-proof). */
  hash: string;
  /** Anchor transaction hash, when `anchor` was requested. */
  anchorTx?: string;
}

/**
 * Issue a credential: build, canonicalize, hash, sign, and optionally anchor.
 *
 * @param opts - Issuer, subject, and anchoring options.
 * @returns The credential, its hash, and the anchor tx hash if requested.
 */
export async function issueCredential(opts: IssueCredentialOptions): Promise<IssuedCredential> {
  const network = opts.network ?? testnetConfig();
  const address = await opts.issuerSigner.publicKey();
  const issuerDid = `did:stellar:${network.network}:${address}`;
  parseDid(issuerDid);
  if (opts.issuerSigner.signMessage === undefined) {
    throw new WalletError("issuer signer does not support message signing");
  }
  const keyId = opts.issuerKeyId ?? "key-1";
  const now = new Date().toISOString();
  const unsigned = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: opts.id ?? `urn:uuid:${crypto.randomUUID()}`,
    type: ["VerifiableCredential", ...(opts.type ?? [])],
    issuer: issuerDid,
    issuanceDate: now,
    ...(opts.expirationDate === undefined ? {} : { expirationDate: opts.expirationDate }),
    credentialSubject: opts.credentialSubject,
  };
  const canonical = canonicalize(unsigned);
  const digestHex = sha256Hex(canonical);
  const signature = await opts.issuerSigner.signMessage(Buffer.from(digestHex, "hex"));
  const credential: VerifiableCredential = {
    ...unsigned,
    proof: {
      type: "StellarEd25519Proof",
      verificationMethod: `${issuerDid}#${keyId}`,
      signatureHex: Buffer.from(signature).toString("hex"),
    },
  };
  let anchorTx: string | undefined;
  if (opts.anchor !== undefined) {
    const expiresAt =
      opts.anchor.expiresAt === undefined ? undefined : BigInt(opts.anchor.expiresAt);
    anchorTx = await submitMutation(
      async (client) =>
        client.anchor_credential({
          issuer: address,
          credential_hash: Buffer.from(digestHex, "hex"),
          expires_at: expiresAt,
        }),
      opts.issuerSigner,
      network,
      issuerDid,
      opts.anchor.submit ?? opts.submit,
    );
  }
  return { credential, hash: digestHex, anchorTx };
}

/** On-chain credential status tag. */
export type CredentialStatusTag = CredentialStatus["tag"];

/** Injected on-chain status reader (default talks to RPC; tests inject). */
export type StatusReader = (issuer: string, hashHex: string) => Promise<CredentialStatusTag>;

/** Options for {@link verifyCredential}. */
export interface VerifyCredentialOptions {
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Injected DID reader for tests. */
  reader?: DidReader;
  /** Injected status reader for tests. */
  statusReader?: StatusReader;
}

/** A successful verification. */
export interface VerificationResult {
  /** Always true (failures throw). */
  valid: true;
  /** Issuer DID. */
  did: string;
  /** SHA-256 hex of the canonical credential. */
  hash: string;
}

/**
 * Create a live RPC-backed on-chain status reader.
 *
 * @param network - Network configuration.
 * @returns The status reader.
 */
export function createStatusReader(network: NetworkConfig): StatusReader {
  return async (issuer: string, hashHex: string): Promise<CredentialStatusTag> => {
    const client = buildClient(network);
    const tx = await client.credential_status({
      issuer,
      credential_hash: Buffer.from(hashHex, "hex"),
    });
    await tx.simulate();
    const status = tx.result as CredentialStatus;
    return status.tag;
  };
}

/**
 * Verify a credential: parse → resolve issuer → key membership → local
 * signature check → on-chain status (anchor/revocation/expiry).
 *
 * @param credential - The credential with its proof.
 * @param opts - Network and optional injected readers.
 * @returns The verification result.
 * @throws {InvalidProofError} On bad signature, unknown key, or unanchored hash.
 * @throws {CredentialRevokedError} When the hash is revoked on-chain.
 * @throws {CredentialExpiredError} When the hash is expired on-chain.
 */
export async function verifyCredential(
  credential: VerifiableCredential,
  opts?: VerifyCredentialOptions,
): Promise<VerificationResult> {
  const network = opts?.network ?? testnetConfig();
  const { address } = parseDid(credential.issuer);
  const reader = opts?.reader ?? createDidReader(network);
  const readStatus = opts?.statusReader ?? createStatusReader(network);
  let record;
  try {
    record = await reader.resolve(address);
  } catch (err) {
    mapCallError(err, credential.issuer);
  }
  if (record.deactivated) {
    throw new InvalidProofError("issuer DID is deactivated");
  }
  const fragment = credential.proof.verificationMethod.split("#")[1] ?? "";
  if (!record.assertion_method.includes(fragment)) {
    throw new InvalidProofError(`key "${fragment}" is not in the issuer assertionMethod`);
  }
  const vm = record.verification_methods.find((m) => m.id === fragment);
  if (vm === undefined) {
    throw new InvalidProofError(`verification method "${fragment}" not found`);
  }
  const { proof: _proof, ...unsigned } = credential;
  const digestHex = sha256Hex(canonicalize(unsigned));
  const issuerKey = Keypair.fromPublicKey(StrKey.encodeEd25519PublicKey(vm.public_key));
  const signatureValid = issuerKey.verify(
    Buffer.from(digestHex, "hex"),
    Buffer.from(credential.proof.signatureHex, "hex"),
  );
  if (!signatureValid) {
    throw new InvalidProofError("Ed25519 signature mismatch");
  }
  const status = await readStatus(address, digestHex);
  if (status === "Revoked") {
    throw new CredentialRevokedError(digestHex);
  }
  if (status === "Expired") {
    throw new CredentialExpiredError(digestHex);
  }
  if (status === "Unknown") {
    throw new InvalidProofError("credential hash is not anchored on-chain");
  }
  return { valid: true, did: credential.issuer, hash: digestHex };
}

/** Options for {@link revokeCredential}. */
export interface RevokeCredentialOptions {
  /** Issuer signer (the address that anchored the hash). */
  issuerSigner: Signer;
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Resilience options. */
  submit?: SubmitOptions;
}

/**
 * Revoke a credential hash on-chain (terminal).
 *
 * @param hashHex - SHA-256 hex of the canonical credential.
 * @param opts - Issuer signer and network.
 * @returns The revocation transaction hash.
 */
export async function revokeCredential(
  hashHex: string,
  opts: RevokeCredentialOptions,
): Promise<{ hash: string }> {
  const network = opts.network ?? testnetConfig();
  const address = await opts.issuerSigner.publicKey();
  const issuerDid = `did:stellar:${network.network}:${address}`;
  const txHash = await submitMutation(
    async (client) =>
      client.revoke_credential({ issuer: address, credential_hash: Buffer.from(hashHex, "hex") }),
    opts.issuerSigner,
    network,
    issuerDid,
    opts.submit,
  );
  return { hash: txHash };
}
