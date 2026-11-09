# Changelog

All notable changes to `stellar-id-docs`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Live at https://stellar-ids.github.io/docs/.

## [Unreleased]

### Added
- Hosted on GitHub Pages (`https://stellar-ids.github.io/docs/`), deployed from `main`
  by `.github/workflows/deploy.yml`.

### Changed
- Node quick start installs `stellar-id-client` from npm; re-run verbatim from a clean
  folder against testnet on 2026-11-09.
- Status lines: the client is on npm, the frontend is not yet; the React quick start
  links the hosted demo.
- Compatibility matrix: records the npm release, and the bindings regeneration steps
  no longer point at a monorepo-only script.

### Fixed
- Node quick start: one runnable script, verified against testnet from a clean
  folder (the previous version created a key-less DID and then failed to issue).
- React quick start: no secrets in browser code; notes that a DID must exist
  before sign-in and that real-wallet sign-in is untested.
- Compatibility matrix lists only what has been tested; packages marked unpublished.
- Contract ID updated to `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`.

## [0.1.0] - 2026-10-15

### Added
- Overview, concepts, Node and React quick starts, API reference (contract, SDK,
  components), security basics, migration from traditional auth, compatibility
  matrix, contributing guide. Docusaurus 3 with broken-link checking.
