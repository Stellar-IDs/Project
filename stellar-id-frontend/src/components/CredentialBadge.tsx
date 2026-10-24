"use client";

/**
 * Credential status chip: Valid / Revoked / Expired / Unknown.
 *
 * Status is always announced as text (never color-only) via an `aria-live`
 * region. Verification runs through `useCredential` (local signature check
 * plus on-chain status).
 */
import { useCredential } from "../hooks/useStellarQueries.js";
import {
  CredentialExpiredError,
  CredentialRevokedError,
} from "stellar-id-client";
import type {
  NetworkConfig,
  VerifiableCredential,
  VerificationResult,
} from "stellar-id-client";
import "./CredentialBadge.css";

/** Displayable credential states. */
export type CredentialBadgeStatus =
  | "checking"
  | "valid"
  | "revoked"
  | "expired"
  | "unknown"
  | "error";

/** Props for {@link CredentialBadge}. */
export interface CredentialBadgeProps {
  /** Credential to check (null renders an idle badge). */
  credential: VerifiableCredential | null;
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Injected verifier for tests and stories. */
  verify?: (credential: VerifiableCredential) => Promise<VerificationResult>;
  /**
   * Change to force revalidation (e.g. increment after revoking — the
   * signature cache key is unchanged by a revocation).
   */
  refreshToken?: string | number;
}

function statusOf(
  data: VerificationResult | null,
  error: { code?: string } | null,
  status: string,
): CredentialBadgeStatus {
  if (status === "loading") {
    return "checking";
  }
  if (data !== null) {
    return "valid";
  }
  if (error !== null) {
    if (error instanceof CredentialRevokedError || error.code === "CREDENTIAL_REVOKED") {
      return "revoked";
    }
    if (error instanceof CredentialExpiredError || error.code === "CREDENTIAL_EXPIRED") {
      return "expired";
    }
    if (error.code === "INVALID_PROOF") {
      return "unknown";
    }
  }
  return "error";
}

const LABELS: Record<CredentialBadgeStatus, string> = {
  checking: "Checking credential…",
  valid: "Valid credential",
  revoked: "Revoked credential",
  expired: "Expired credential",
  unknown: "Unknown credential",
  error: "Credential check failed",
};

/**
 * Status chip for a verifiable credential.
 *
 * @param props - Credential, network, and optional injected verifier.
 */
export function CredentialBadge({
  credential,
  network,
  verify,
  refreshToken,
}: CredentialBadgeProps): React.JSX.Element {
  const { data, error, status } = useCredential(credential, {
    network,
    verify,
    cacheSuffix: refreshToken,
  });
  const badge = credential === null ? "unknown" : statusOf(data, error, status);
  return (
    <span className={`sid-badge sid-badge--${badge}`} role="status" aria-live="polite">
      {credential === null ? "No credential" : LABELS[badge]}
    </span>
  );
}
