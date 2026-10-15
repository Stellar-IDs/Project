/**
 * Sign-in challenges: the "authentication" half of the suite.
 *
 * Flow: the app creates a {@link Challenge} (nonce, domain, expiry); the
 * user's wallet signs the challenge bytes; {@link verifyChallengeResponse}
 * resolves the DID, checks the key is in `authentication`, verifies the
 * signature, and enforces nonce/expiry/domain binding. Session issuance
 * (cookies/JWTs) stays the app's job — the SDK only authenticates the
 * challenge/response.
 */
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { parseDid } from "./did.js";
import { InvalidProofError } from "./errors.js";
import { mapCallError } from "./gateway.js";
import type { NetworkConfig } from "./networks.js";
import { testnetConfig } from "./networks.js";
import type { DidReader } from "./resolver.js";
import { createDidReader } from "./resolver.js";

/** Challenge version prefix (domain separation for signatures). */
export const CHALLENGE_VERSION = "stellar-id-challenge:v1";

/** A sign-in challenge to be signed by the user's wallet. */
export interface Challenge {
  /** Application domain the challenge is bound to (replay protection). */
  domain: string;
  /** Optional expected signer address (`G...`); unbound when absent. */
  address?: string;
  /** Random nonce, hex-encoded. */
  nonce: string;
  /** Issued-at, unix seconds. */
  issuedAt: number;
  /** Expiry, unix seconds. */
  expiresAt: number;
}

/** Options for {@link createChallenge}. */
export interface CreateChallengeOptions {
  /** Application domain (must match at verification). */
  domain: string;
  /** Bind the challenge to one address. */
  address?: string;
  /** Lifetime in seconds (default 300). */
  ttlSeconds?: number;
  /** Nonce length in bytes (default 16). */
  nonceBytes?: number;
}

/**
 * Create a fresh sign-in challenge.
 *
 * @param opts - Domain, optional address binding, TTL, nonce size.
 * @returns The challenge (send the whole object to the wallet side).
 */
export function createChallenge(opts: CreateChallengeOptions): Challenge {
  const nonceBytes = new Uint8Array(opts.nonceBytes ?? 16);
  crypto.getRandomValues(nonceBytes);
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    domain: opts.domain,
    ...(opts.address === undefined ? {} : { address: opts.address }),
    nonce: Buffer.from(nonceBytes).toString("hex"),
    issuedAt,
    expiresAt: issuedAt + (opts.ttlSeconds ?? 300),
  };
}

/**
 * Canonical challenge bytes that get signed (domain-separated).
 *
 * @param challenge - The challenge.
 * @returns The exact bytes the wallet must sign.
 */
export function challengeBytes(challenge: Challenge): Uint8Array {
  const text = [
    CHALLENGE_VERSION,
    challenge.domain,
    challenge.address ?? "",
    challenge.nonce,
    String(challenge.issuedAt),
    String(challenge.expiresAt),
  ].join("|");
  return new TextEncoder().encode(text);
}

/** Nonce replay-protection store. */
export interface NonceStore {
  /** @param nonce - Hex nonce. @returns True if already consumed. */
  has(nonce: string): Promise<boolean>;
  /** Mark a nonce as consumed. @param nonce - Hex nonce. */
  add(nonce: string): Promise<void>;
}

/**
 * In-memory nonce store. For development only: restarts (and multiple
 * server instances) forget consumed nonces. Production apps must persist
 * nonces (database, cache) behind this interface.
 */
export class InMemoryNonceStore implements NonceStore {
  private readonly seen = new Set<string>();

  /** @param nonce - Hex nonce. @returns True if already consumed. */
  async has(nonce: string): Promise<boolean> {
    return this.seen.has(nonce);
  }

  /** Mark a nonce as consumed. @param nonce - Hex nonce. */
  async add(nonce: string): Promise<void> {
    this.seen.add(nonce);
  }
}

/** A wallet-signed challenge response. */
export interface ChallengeResponse {
  /** The challenge that was signed. */
  challenge: Challenge;
  /** Claimed signer address (`G...`). */
  address: string;
  /** Ed25519 signature over {@link challengeBytes}, hex-encoded. */
  signatureHex: string;
  /** Expected domain (must equal the challenge domain). */
  domain: string;
}

/** Options for {@link verifyChallengeResponse}. */
export interface VerifyChallengeOptions {
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Injected DID reader for tests. */
  reader?: DidReader;
  /** Replay-protection store (absent = no replay check; not recommended). */
  nonceStore?: NonceStore;
  /** Clock override for tests (unix seconds). */
  nowSeconds?: number;
}

/** An authenticated identity. */
export interface AuthenticatedIdentity {
  /** The signer's DID. */
  did: string;
  /** The signer's address. */
  address: string;
}

/**
 * Verify a challenge response and return the authenticated identity.
 *
 * Checks: domain binding, expiry, DID resolution, signing key membership
 * in `authentication`, Ed25519 signature, and nonce replay.
 *
 * @param resp - The wallet-signed response.
 * @param opts - Network, reader, nonce store, clock.
 * @returns The authenticated identity (the app then issues its own session).
 * @throws {InvalidProofError} On any check failure.
 */
export async function verifyChallengeResponse(
  resp: ChallengeResponse,
  opts?: VerifyChallengeOptions,
): Promise<AuthenticatedIdentity> {
  const network = opts?.network ?? testnetConfig();
  const now = opts?.nowSeconds ?? Math.floor(Date.now() / 1000);
  const { challenge } = resp;
  if (resp.domain !== challenge.domain) {
    throw new InvalidProofError("challenge domain mismatch");
  }
  if (challenge.address !== undefined && challenge.address !== resp.address) {
    throw new InvalidProofError("challenge is bound to a different address");
  }
  if (now >= challenge.expiresAt) {
    throw new InvalidProofError("challenge has expired");
  }
  const { address } = parseDid(`did:stellar:${network.network}:${resp.address}`);
  const reader = opts?.reader ?? createDidReader(network);
  let record;
  try {
    record = await reader.resolve(address);
  } catch (err) {
    mapCallError(err, resp.address);
  }
  if (record.deactivated) {
    throw new InvalidProofError("signer DID is deactivated");
  }
  const message = Buffer.from(challengeBytes(challenge));
  const signature = Buffer.from(resp.signatureHex, "hex");
  let verified = false;
  for (const fragment of record.authentication) {
    const vm = record.verification_methods.find((m) => m.id === fragment);
    if (vm === undefined) {
      continue;
    }
    const key = Keypair.fromPublicKey(StrKey.encodeEd25519PublicKey(vm.public_key));
    if (key.verify(message, signature)) {
      verified = true;
      break;
    }
  }
  if (!verified) {
    throw new InvalidProofError("no authentication key matched the signature");
  }
  if (opts?.nonceStore !== undefined) {
    if (await opts.nonceStore.has(challenge.nonce)) {
      throw new InvalidProofError("challenge nonce was already used");
    }
    await opts.nonceStore.add(challenge.nonce);
  }
  const did = `did:stellar:${network.network}:${address}`;
  return { did, address };
}
