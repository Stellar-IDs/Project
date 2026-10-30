/**
 * Internal bridge between the SDK's typed API and the vendored contract
 * bindings: client construction, contract-error mapping, and resilient
 * submission (retry + timeout).
 *
 * Not part of the public API surface beyond what `index.ts` re-exports.
 */
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { Client } from "./generated/index.js";
import type { Result } from "@stellar/stellar-sdk/contract";
import {
  DidDeactivatedError,
  DidNotFoundError,
  NetworkError,
  SimulationError,
} from "./errors.js";
import type { NetworkConfig } from "./networks.js";
import type { Signer } from "./signers.js";

/** Known contract error names (see generated `ContractError`). */
const CONTRACT_ERROR_NAMES = [
  "NotFound",
  "AlreadyExists",
  "Unauthorized",
  "Deactivated",
  "InvalidVerificationMethod",
  "InvalidProof",
  "Revoked",
  "Expired",
  "LimitExceeded",
  "InvalidInput",
] as const;

/**
 * Extract a contract error name from an SDK-thrown error, if present.
 *
 * @param err - The caught error.
 * @returns The contract error name, or `undefined` when the failure is not
 * a declared contract error.
 */
export function contractErrorName(err: unknown): string | undefined {
  // `Result.unwrapErr()` yields a plain `{ message }` (stellar-sdk
  // `ErrorMessage`), not an `Error`, so read `message` structurally.
  const message =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
      ? err.message
      : String(err);
  return CONTRACT_ERROR_NAMES.find((name) => new RegExp(`\\b${name}\\b`).test(message));
}

/**
 * Build a typed contract client for a network.
 *
 * @param network - Network configuration.
 * @param publicKey - Optional invoker address (required for mutations).
 * @returns The generated contract client.
 */
export function buildClient(network: NetworkConfig, publicKey?: string): Client {
  return new Client({
    contractId: network.contractId,
    networkPassphrase: network.networkPassphrase,
    rpcUrl: network.rpcUrl,
    ...(publicKey === undefined ? {} : { publicKey }),
  });
}

/**
 * Unwrap a contract `Result<T, E>`: return the value on `Ok`, throw the
 * mapped typed error on `Err`. Passes plain values through untouched (the
 * SDK sometimes returns already-unwrapped values).
 *
 * @param result - The simulation result.
 * @param did - DID string for error context.
 * @returns The unwrapped value.
 * @throws {DidNotFoundError} On `NotFound`.
 * @throws {DidDeactivatedError} On `Deactivated`.
 * @throws {SimulationError} On any other contract rejection.
 */
export function unwrapResult<T>(result: Result<T> | T, did: string): T {
  if (typeof result === "object" && result !== null && "isErr" in result) {
    const r = result as unknown as Result<T>;
    if (r.isErr()) {
      const name = contractErrorName(r.unwrapErr());
      if (name === "NotFound") {
        throw new DidNotFoundError(did);
      }
      if (name === "Deactivated") {
        throw new DidDeactivatedError(did);
      }
      throw new SimulationError(`contract rejected the call${name === undefined ? "" : `: ${name}`}`);
    }
    return r.unwrap();
  }
  return result;
}

/**
 * Map a thrown SDK/RPC error to a typed SDK error.
 *
 * @param err - The caught error.
 * @param did - DID string for error context.
 * @returns Never returns; always throws the mapped error.
 * @throws {NetworkError} On transport-level failures.
 * @throws {DidNotFoundError} On contract `NotFound`.
 * @throws {DidDeactivatedError} On contract `Deactivated`.
 * @throws {SimulationError} On everything else.
 */
export function mapCallError(err: unknown, did: string): never {
  if (err instanceof DidNotFoundError || err instanceof DidDeactivatedError) {
    throw err;
  }
  const message = err instanceof Error ? err.message : String(err);
  if (
    err instanceof TypeError ||
    /fetch|network|ECONN|ETIMEDOUT|ENOTFOUND|502|503|504|timeout/i.test(message)
  ) {
    throw new NetworkError(message, err);
  }
  const name = contractErrorName(err);
  if (name === "NotFound") {
    throw new DidNotFoundError(did);
  }
  if (name === "Deactivated") {
    throw new DidDeactivatedError(did);
  }
  throw new SimulationError(
    name === undefined ? message : `contract rejected the call: ${name}`,
    err,
  );
}

/**
 * Adapt an SDK {@link Signer} to the stellar-sdk `signTransaction` callback
 * shape expected by `signAndSend`.
 *
 * @param signer - The SDK signer.
 * @param network - Network configuration (passphrase fallback).
 * @returns The callback for `signAndSend`.
 */
export function adaptSigner(signer: Signer, network: NetworkConfig) {
  return async (
    xdr: string,
    opts?: { networkPassphrase?: string },
  ): Promise<{ signedTxXdr: string }> => ({
    signedTxXdr: await signer.signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? network.networkPassphrase,
    }),
  });
}

/** Options for resilient submission. */
export interface SubmitOptions {
  /** Max attempts including the first (default 3). Retries transport errors only. */
  maxAttempts?: number;
  /** Base backoff in ms; doubled per retry (default 500). */
  backoffMs?: number;
  /** Overall timeout in ms per attempt, covering finality polling (default 120_000). */
  timeoutMs?: number;
}

/**
 * Race a promise against a timeout.
 *
 * @param promise - The work to bound.
 * @param ms - Timeout in milliseconds.
 * @param what - Description for the timeout error.
 * @returns The promise's value.
 * @throws {NetworkError} On timeout.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new NetworkError(`${what} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * Simulate, sign, and submit a mutation with retry on transport errors.
 *
 * Contract rejections (including simulation failures) are never retried.
 *
 * @param build - Builds the assembled transaction (already simulated by the bindings).
 * @param signer - Authorizing signer.
 * @param network - Network configuration.
 * @param did - DID string for error context.
 * @param opts - Resilience options.
 * @returns The submitted transaction hash.
 */
export async function submitMutation(
  build: (client: Client) => Promise<AssembledTransaction<unknown>>,
  signer: Signer,
  network: NetworkConfig,
  did: string,
  opts?: SubmitOptions,
): Promise<string> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const backoffMs = opts?.backoffMs ?? 500;
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const address = await signer.publicKey();
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const client = buildClient(network, address);
      const tx = await withTimeout(build(client), timeoutMs, "simulation");
      const sent = await withTimeout(
        tx.signAndSend({ signTransaction: adaptSigner(signer, network) }),
        timeoutMs,
        "submission",
      );
      const txHash = sent.getTransactionResponse?.txHash;
      if (txHash === undefined) {
        throw new SimulationError("submission finalized without a transaction hash");
      }
      return txHash;
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof NetworkError ||
        (err instanceof TypeError &&
          /fetch|network|ECONN|ETIMEDOUT|ENOTFOUND|timeout/i.test(
            err instanceof Error ? err.message : String(err),
          ));
      if (!retryable || attempt === maxAttempts) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** (attempt - 1)));
    }
  }
  return mapCallError(lastError, did);
}
