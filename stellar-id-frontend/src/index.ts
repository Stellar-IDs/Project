/**
 * stellar-id-frontend — accessible, themeable React components and hooks
 * for the Stellar Identity & Authentication Suite (testnet / v0.x).
 *
 * Styling is CSS variables (see `./theme/variables.css`, imported here so
 * bundlers include the tokens); override `--sid-*` in your own CSS.
 * Interactive modules carry `"use client"` for the Next.js App Router.
 */
import "./theme/variables.css";

export {
  SessionProvider,
  useSession,
  useSessionActions,
  useIdentity,
  useIdentityStatus,
} from "./session/SessionProvider.js";
export type {
  SessionStatus,
  SessionState,
  SessionActions,
  SessionConfig,
} from "./session/SessionProvider.js";
export { useDidDocument, useCredential } from "./hooks/useStellarQueries.js";
export type { QueryStatus, QueryResult } from "./hooks/useStellarQueries.js";
export { IdentityLogin } from "./components/IdentityLogin.js";
export type { IdentityLoginProps } from "./components/IdentityLogin.js";
export { IdentityProfile, IdentityProfileView } from "./components/IdentityProfile.js";
export type { IdentityProfileProps } from "./components/IdentityProfile.js";
export { CredentialBadge } from "./components/CredentialBadge.js";
export type { CredentialBadgeStatus, CredentialBadgeProps } from "./components/CredentialBadge.js";
export { withAuth } from "./components/withAuth.js";
export type { WithAuthOptions } from "./components/withAuth.js";
export { toHex } from "./utils/hex.js";
// Re-exported so apps handle SDK failures from one package.
export {
  StellarIdError,
  DidParseError,
  DidNotFoundError,
  DidDeactivatedError,
  InvalidProofError,
  CredentialRevokedError,
  CredentialExpiredError,
  NetworkError,
  SimulationError,
  WalletError,
} from "stellar-id-client";
export type {
  Signer,
  NetworkConfig,
  VerifiableCredential,
  VerificationResult,
  ResolutionResult,
} from "stellar-id-client";
