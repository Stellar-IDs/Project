# Roadmap — docs

Where the documentation stands and what comes next. No dates are promised; this file is updated as items land.
Status: **testnet only, v0.x.**

## Done (0.1.0)

- [Live site](https://stellar-ids.github.io/docs/): concepts, Node and React quick starts, API reference (contract,
  SDK, components), security basics, migration from traditional auth, compatibility matrix.
- The Node quick start was re-run verbatim from a clean folder against testnet with the npm package (2026-11-09).
- Every build is link-checked; broken internal links fail it.

## Open for contributors (Wave)

| Issue | Points | What it delivers |
|---|---|---|
| [#1 Full React integration guide](https://github.com/Stellar-IDs/docs/issues/1) | 3 | Provider, hooks, protected routes and error handling, step by step |
| [#2 Vue integration guide](https://github.com/Stellar-IDs/docs/issues/2) | 3 | A full Vue guide using the SDK directly |
| [#3 Full-stack example](https://github.com/Stellar-IDs/docs/issues/3) | 4 | Frontend + backend + contract in one working example |
| [#4 Security best-practices guide](https://github.com/Stellar-IDs/docs/issues/4) | 2 | Key management, phishing, replay, revocation, privacy, incident response |

## Maintainer track

- Versioned docs once the contract interface is frozen.
- Pull code samples from the tested examples instead of maintaining them by hand (a known gap).
- Re-run the quick starts against every release.

## Not planned for v1

Mainnet guides, and a custom docs generator (the site stays on Docusaurus).
