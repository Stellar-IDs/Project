# Changelog

All notable changes to `stellar-id-docs`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The site is not hosted yet.

## [Unreleased]

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
