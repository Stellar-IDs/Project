"use client";

/**
 * Data hooks with caching, dedupe, and explicit status: `useDidDocument`
 * and `useCredential`. Every hook exposes `{ data, error, status, refetch }`
 * and never swallows errors. Reader/verify functions are injectable so
 * tests (and stories) avoid the network.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StellarIdError,
  resolveIdentity,
  verifyCredential,
} from "stellar-id-client";
import type {
  NetworkConfig,
  ResolutionResult,
  VerifiableCredential,
  VerificationResult,
} from "stellar-id-client";
import { testnetConfig } from "stellar-id-client";

/** Async query lifecycle status. */
export type QueryStatus = "idle" | "loading" | "success" | "error";

/** Standard query result shape. */
export interface QueryResult<T> {
  /** Resolved data, or null while idle/loading/error. */
  data: T | null;
  /** Failure, or null on success. */
  error: StellarIdError | null;
  /** Lifecycle status. */
  status: QueryStatus;
  /** Re-run the query (bypasses the cache). */
  refetch: () => void;
}

type ResolveFn = typeof resolveIdentity;
type VerifyFn = typeof verifyCredential;

// In-memory caches (per page load): resolved documents by DID, verified
// credentials by hash. Bounded growth is the app's concern in v1; entries
// are small and keyed by content identity.
const documentCache = new Map<string, ResolutionResult>();
const documentInflight = new Map<string, Promise<ResolutionResult>>();

/**
 * Resolve a DID document with caching and request dedupe.
 *
 * @param did - The DID to resolve, or null to stay idle.
 * @param opts - Network and optional injected `resolve` for tests.
 * @returns The query result.
 */
export function useDidDocument(
  did: string | null,
  opts?: { network?: NetworkConfig; resolve?: ResolveFn },
): QueryResult<ResolutionResult> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Omit<QueryResult<ResolutionResult>, "refetch">>({
    data: null,
    error: null,
    status: "idle",
  });
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (did === null) {
      setState({ data: null, error: null, status: "idle" });
      return;
    }
    let cancelled = false;
    const network = optsRef.current?.network ?? testnetConfig();
    const resolve = optsRef.current?.resolve ?? resolveIdentity;
    const load = async (): Promise<void> => {
      const cached = nonce === 0 ? documentCache.get(did) : undefined;
      if (cached !== undefined) {
        setState({ data: cached, error: null, status: "success" });
        return;
      }
      setState({ data: null, error: null, status: "loading" });
      try {
        let inflight = documentInflight.get(did);
        if (inflight === undefined) {
          inflight = resolve(did, { network });
          documentInflight.set(did, inflight);
        }
        const result = await inflight;
        documentInflight.delete(did);
        documentCache.set(did, result);
        if (!cancelled) {
          setState({ data: result, error: null, status: "success" });
        }
      } catch (err) {
        documentInflight.delete(did);
        if (!cancelled) {
          setState({
            data: null,
            error:
              err instanceof StellarIdError
                ? err
                : new StellarIdError("Failed to resolve the DID.", "NETWORK", err),
            status: "error",
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // Intentionally keyed on [did, nonce] only: options travel via a ref so
    // inline option objects don't refetch every render.
  }, [did, nonce]);

  const refetch = useCallback(() => {
    if (did !== null) {
      documentCache.delete(did);
    }
    setNonce((n) => n + 1);
  }, [did]);

  return { ...state, refetch };
}

const verificationCache = new Map<string, VerificationResult>();

/**
 * Verify a credential (local signature check + on-chain status).
 *
 * @param credential - The credential to verify, or null to stay idle.
 * @param opts - Network and optional injected `verify` for tests.
 * @returns The query result.
 */
export function useCredential(
  credential: VerifiableCredential | null,
  opts?: { network?: NetworkConfig; verify?: VerifyFn; cacheSuffix?: string | number },
): QueryResult<VerificationResult> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Omit<QueryResult<VerificationResult>, "refetch">>({
    data: null,
    error: null,
    status: "idle",
  });
  const optsRef = useRef(opts);
  optsRef.current = opts;
  // The suffix lets parents force revalidation (e.g. after a revocation)
  // for a credential whose signature (the natural cache key) is unchanged.
  const cacheKey =
    credential === null
      ? null
      : `${credential.proof.signatureHex}|${opts?.cacheSuffix ?? ""}`;

  useEffect(() => {
    if (credential === null || cacheKey === null) {
      setState({ data: null, error: null, status: "idle" });
      return;
    }
    let cancelled = false;
    const network = optsRef.current?.network ?? testnetConfig();
    const verify = optsRef.current?.verify ?? verifyCredential;
    const load = async (): Promise<void> => {
      const cached = nonce === 0 ? verificationCache.get(cacheKey) : undefined;
      if (cached !== undefined) {
        setState({ data: cached, error: null, status: "success" });
        return;
      }
      setState({ data: null, error: null, status: "loading" });
      try {
        const result = await verify(credential, { network });
        verificationCache.set(cacheKey, result);
        if (!cancelled) {
          setState({ data: result, error: null, status: "success" });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            error:
              err instanceof StellarIdError
                ? err
                : new StellarIdError("Failed to verify the credential.", "NETWORK", err),
            status: "error",
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // Intentionally keyed on identity + nonce only (see above).
  }, [credential, cacheKey, nonce]);

  const refetch = useCallback(() => {
    if (cacheKey !== null) {
      verificationCache.delete(cacheKey);
    }
    setNonce((n) => n + 1);
  }, [cacheKey]);

  return { ...state, refetch };
}
