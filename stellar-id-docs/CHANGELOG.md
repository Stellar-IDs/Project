# Changelog

All notable changes to `stellar-id-docs`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Live at https://stellar-ids.github.io/docs/.

## [Unreleased]

### Fixed
- `stellar-id-frontend` has been on npm since 2026-11-08, but the intro, home page, React quick start and
  compatibility matrix said it was unpublished. The React quick start now installs it directly.
- Compatibility matrix: core is `0.1.1` (tag `v0.1.1`), the release that describes the testnet contract.
- README: the Node quick start was last verified with the client from npm, not a tarball.

## [0.1.0] - 2026-11-09

Tag `v0.1.0`. First hosted release.

### Added
- Overview, concepts, Node and React quick starts, API reference (contract, SDK,
  components), security basics, migration from traditional auth, compatibility
  matrix, contributing guide. Docusaurus 3 with broken-link checking.
- Hosted on GitHub Pages, deployed from `main` by `.github/workflows/deploy.yml`.
- Node quick start: one runnable script that installs `stellar-id-client` from npm;
  re-run verbatim from a clean folder against testnet on 2026-11-09.
- React quick start: no secrets in browser code; says that a DID must exist before
  sign-in and that real-wallet sign-in is untested; links the hosted demo.
- Compatibility matrix listing only tested combinations, for testnet contract
  `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`.
- `ROADMAP.md`.
