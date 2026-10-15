/**
 * Typed error hierarchy for stellar-id-client.
 *
 * Every failure surfaced by the public API is a {@link StellarIdError}
 * subclass — never a plain string — so callers can discriminate with
 * `instanceof`. Each subclass carries a stable machine-readable `code`.
 */

/** Base class for all SDK errors. */
export class StellarIdError extends Error {
  /** Stable machine-readable error code (e.g. `"DID_NOT_FOUND"`). */
  public readonly code: string;
  /** The underlying error, if any (network failures, wallet errors). */
  public readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;
  }
}

/** A DID string failed to parse (bad method, network, or address). */
export class DidParseError extends StellarIdError {
  constructor(did: string, detail = "malformed did:stellar string") {
    super(`Cannot parse DID "${did}": ${detail}.`, "DID_PARSE");
  }
}

/** The DID has no on-chain record (`Unknown` status / `NotFound`). */
export class DidNotFoundError extends StellarIdError {
  constructor(did: string) {
    super(`DID "${did}" was not found on-chain.`, "DID_NOT_FOUND");
  }
}

/** The DID exists but is deactivated; mutations are rejected. */
export class DidDeactivatedError extends StellarIdError {
  constructor(did: string) {
    super(`DID "${did}" is deactivated.`, "DID_DEACTIVATED");
  }
}

/** A credential proof failed: bad signature, unknown key, or unanchored hash. */
export class InvalidProofError extends StellarIdError {
  constructor(detail: string) {
    super(`Invalid credential proof: ${detail}.`, "INVALID_PROOF");
  }
}

/** The credential was explicitly revoked on-chain. */
export class CredentialRevokedError extends StellarIdError {
  constructor(hashHex: string) {
    super(`Credential ${hashHex} has been revoked.`, "CREDENTIAL_REVOKED");
  }
}

/** The credential passed its on-chain `expires_at`. */
export class CredentialExpiredError extends StellarIdError {
  constructor(hashHex: string) {
    super(`Credential ${hashHex} has expired.`, "CREDENTIAL_EXPIRED");
  }
}

/** Transport-level failure talking to Soroban RPC (fetch errors, timeouts). */
export class NetworkError extends StellarIdError {
  constructor(detail: string, cause?: unknown) {
    super(`Network error: ${detail}.`, "NETWORK", cause);
  }
}

/** Simulation failed or the contract rejected the call. */
export class SimulationError extends StellarIdError {
  constructor(detail: string, cause?: unknown) {
    super(`Simulation failed: ${detail}.`, "SIMULATION", cause);
  }
}

/** The wallet (or signer) failed or does not support an operation. */
export class WalletError extends StellarIdError {
  constructor(detail: string, cause?: unknown) {
    super(`Wallet error: ${detail}.`, "WALLET", cause);
  }
}
