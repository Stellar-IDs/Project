# Changelog

All notable changes to `stellar-id-core`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/). Testnet only.

## [0.1.1] - 2026-11-09

Tag `v0.1.1`. Deployed to testnet as `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`
(wasm hash `6b0d275b…cde14`, built with stellar CLI 28.1.0). No public function signatures changed
since 0.1.0.

### Changed
- CI installs stellar CLI 28.1.0, the version that built the deployed wasm, instead of the latest release.
- `cargo audit` in CI skips RUSTSEC-2026-0387, accepted in `docs/SECURITY_REVIEW.md` as host-only;
  CI installs the `wasm32v1-none` target the wasm build needs.

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

Tag `v0.1.0` (`core-v0.1.0` before the split). Testnet deployment `CBFXX2HC…TXXE` (superseded).

### Added
- `did:stellar` DID lifecycle: `create_did`, `resolve`, `add/remove_verification_method`,
  `set_relationships`, `add/remove_service`, `deactivate_did`, `rotate_controller`, `bump_ttl`.
- Credential anchoring: `anchor_credential`, `revoke_credential`, `credential_status`,
  `verify_credential_proof` (Ed25519).
- `docs/METHOD_SPEC.md`, `docs/test-vectors.json`, `docs/SMOKE_TEST.md`.
