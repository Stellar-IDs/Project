# Changelog

All notable changes to `stellar-id-client`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/). Not published to npm yet. Testnet only.

## [Unreleased]

### Fixed
- Contract errors returned as a simulation `Result` (`Err({ message })`) are now
  mapped to typed errors; on-chain `NotFound` raises `DidNotFoundError` instead of
  an unnamed `SimulationError`.
- Failed write simulations (`Error(Contract, #N)`) now name the error, e.g.
  "contract rejected the call: AlreadyExists".
- `@stellar/stellar-sdk` raised to `^16.4.1`, which pins a patched axios (1.20.0).

### Changed
- Vendored bindings target testnet contract
  `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`.

### Added
- Gateway unit tests; integration test asserts the typed `DidNotFoundError` live.

## [0.1.0] - 2026-10-15

### Added
- DID API: `parseDid`/`formatDid`, `createIdentity`, `resolveIdentity`, `updateIdentity`,
  `deactivateIdentity`, W3C DID document mapping (`toW3CDocument`). Controller
  rotation is contract-only (no SDK wrapper yet).
- Credentials: `issueCredential` (JCS + SHA-256 + Ed25519, optional anchoring),
  `verifyCredential`, `revokeCredential`.
- Sign-in: `createChallenge`, `challengeBytes`, `verifyChallengeResponse`, `InMemoryNonceStore`.
- Signers: `KeypairSigner`, `WalletsKitSigner` (fake-kit tested only).
- Typed errors (`StellarIdError` subclasses), ESM + CJS builds, vendored contract bindings.
