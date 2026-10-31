# Changelog

All notable changes to `stellar-id-core`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/). Testnet only.

## [Unreleased]

Deployed to testnet as `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`.
No public function signatures changed since 0.1.0.

### Fixed
- `create_did` now bounds the service `kind` length (128 bytes), like `add_service` (SECURITY_REVIEW F-1).
- `authentication` / `assertion_method` lists are capped at 10 entries in `create_did`
  (`InvalidInput`) and `set_relationships` (`LimitExceeded`) (F-3).
- `ContractError` variants are documented, so stellar-sdk clients receive error names
  instead of empty messages (F-8).
- `credential_status` doc comment was attached to the wrong function.

### Added
- `docs/SECURITY_REVIEW.md` (self-review findings, checklist, `cargo audit` results).
- `docs/COSTS.md` (fees measured on testnet per call).
- Regression tests for each fix (59 tests total).

## [0.1.0] - 2026-10-15

Tag `core-v0.1.0`. Testnet deployment `CBFXX2HC…TXXE` (superseded).

### Added
- `did:stellar` DID lifecycle: `create_did`, `resolve`, `add/remove_verification_method`,
  `set_relationships`, `add/remove_service`, `deactivate_did`, `rotate_controller`, `bump_ttl`.
- Credential anchoring: `anchor_credential`, `revoke_credential`, `credential_status`,
  `verify_credential_proof` (Ed25519).
- `docs/METHOD_SPEC.md`, `docs/test-vectors.json`, `docs/SMOKE_TEST.md`.
