/**
 * stellar-id-client — TypeScript SDK for the Stellar Identity &
 * Authentication Suite.
 *
 * Typed wrapper around the `stellar-id-core` Soroban contract
 * (`did:stellar` DIDs, credential anchoring, revocation): identity
 * lifecycle, W3C rendering, verifiable credentials, and sign-in
 * challenges, with wallet adapters. Testnet-first; see README for status
 * and limitations.
 */
export { parseDid, formatDid } from "./did.js";
export type { DidNetwork, ParsedDid } from "./did.js";
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
} from "./errors.js";
export { testnetConfig, publicConfig, TESTNET_RPC_URL } from "./networks.js";
export type { NetworkConfig } from "./networks.js";
export { KeypairSigner, WalletsKitSigner } from "./signers.js";
export type {
  Signer,
  SignTransactionOptions,
  WalletKitLike,
} from "./signers.js";
export { toW3CDocument, publicKeyToMultibase, multibaseToPublicKeyHex } from "./w3c.js";
export type { DidDocument, W3CVerificationMethod, W3CService } from "./w3c.js";
export { resolveIdentity, createDidReader } from "./resolver.js";
export type {
  DidReader,
  ResolveOptions,
  ResolutionMetadata,
  DocumentMetadata,
  ResolutionResult,
} from "./resolver.js";
export { createIdentity, updateIdentity, deactivateIdentity } from "./identity.js";
export type {
  TxResult,
  NewKey,
  NewService,
  CreateIdentityOptions,
  Identity,
  IdentityPatch,
  MutateOptions,
} from "./identity.js";
export {
  canonicalize,
  sha256Hex,
  issueCredential,
  verifyCredential,
  revokeCredential,
  createStatusReader,
} from "./credentials.js";
export type {
  CredentialProof,
  VerifiableCredential,
  IssueCredentialOptions,
  IssuedCredential,
  CredentialStatusTag,
  StatusReader,
  VerifyCredentialOptions,
  VerificationResult,
  RevokeCredentialOptions,
} from "./credentials.js";
export {
  createChallenge,
  challengeBytes,
  verifyChallengeResponse,
  InMemoryNonceStore,
  CHALLENGE_VERSION,
} from "./challenge.js";
export type {
  Challenge,
  CreateChallengeOptions,
  NonceStore,
  ChallengeResponse,
  VerifyChallengeOptions,
  AuthenticatedIdentity,
} from "./challenge.js";
