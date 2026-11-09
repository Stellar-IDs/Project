<div align="center">

# Stellar ID

**Decentralized identity and sign-in for Stellar: a Soroban DID & credential registry, a TypeScript SDK, React components and documentation.**

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Network](https://img.shields.io/badge/network-testnet-orange)
![Status](https://img.shields.io/badge/status-v0.x%20·%20unaudited-yellow)
[![npm](https://img.shields.io/npm/v/stellar-id-client?label=stellar-id-client)](https://www.npmjs.com/package/stellar-id-client)
[![npm](https://img.shields.io/npm/v/stellar-id-frontend?label=stellar-id-frontend)](https://www.npmjs.com/package/stellar-id-frontend)

**[Live demo](https://stellar-ids.github.io/frontend/)** · **[Docs site](https://stellar-ids.github.io/docs/)** · [Contract on testnet](https://github.com/Stellar-IDs/core#deployment)

</div>

> **Status.** Testnet only, v0.x, self-reviewed but **not independently audited**. Mainnet is an explicit non-goal
> for v1. `stellar-id-client` and `stellar-id-frontend` 0.1.0 are on npm.

<p align="center">
  <img src="stellar-id-frontend/demo/demo.gif" width="640" alt="The hosted demo on testnet: pick a throwaway wallet, register its did:stellar DID, sign in, issue a credential, then revoke it and watch the badge change from Valid to Revoked">
</p>
<p align="center"><sub>Recorded from the <a href="https://stellar-ids.github.io/frontend/">hosted demo</a> on testnet.</sub></p>

---

## What is this?

Stellar ID gives an application three things that passwords and OAuth do not:

1. **An identity the user owns.** A `did:stellar` identifier derived from the user's own Stellar account, with
   keys and service endpoints recorded on-chain.
2. **Sign-in by signature.** The user proves control of their DID by signing a one-time challenge — no password,
   no third-party identity provider.
3. **Credentials that can be revoked.** Issuers anchor a *hash* of a credential on-chain; anyone can check
   whether it is still valid, while the credential itself — and any personal data in it — stays off-chain.

```
did:stellar:testnet:GABCD…XYZ
```

## The four repositories

The suite is developed here as a monorepo and published as four repositories. Dependencies flow one way:
**core → client → frontend → docs**.

| Repository | Folder here | Language | What it is |
|---|---|---|---|
| [**core**](https://github.com/Stellar-IDs/core) | `stellar-id-core/` | Rust (Soroban) | The on-chain registry: DID lifecycle, credential anchoring, revocation, Ed25519 proof checks. 14 public functions, 59 tests. |
| [**client**](https://github.com/Stellar-IDs/client) | `stellar-id-client/` | TypeScript | The SDK: create / resolve / update / deactivate DIDs, issue / verify / revoke credentials, challenge sign-in, wallet adapters. On npm as [`stellar-id-client`](https://www.npmjs.com/package/stellar-id-client). |
| [**frontend**](https://github.com/Stellar-IDs/frontend) | `stellar-id-frontend/` | React / Next.js | `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, `withAuth`, CSS-variable theming, and a Next.js demo ([hosted](https://stellar-ids.github.io/frontend/)). On npm as [`stellar-id-frontend`](https://www.npmjs.com/package/stellar-id-frontend). |
| [**docs**](https://github.com/Stellar-IDs/docs) | `stellar-id-docs/` | Docusaurus | Concepts, quick starts, API references, security guidance. [Live site](https://stellar-ids.github.io/docs/). |

## How the pieces fit

```mermaid
flowchart TB
    App["Your application"] --> FE["frontend<br/>React components & hooks"]
    FE --> SDK["client<br/>TypeScript SDK"]
    SDK -- "Soroban RPC" --> Core["core<br/>identity contract on Stellar testnet"]
    Wallet["User's wallet / signer"] -. "signs transactions & challenges" .-> SDK
    Docs["docs<br/>guides & API reference"] -. "documents" .-> FE
    Docs -.-> SDK
    Docs -.-> Core
```

## What works today

- The contract is **deployed on testnet** with its full DID and credential lifecycle
  (`CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`).
- The SDK runs create → resolve → update → issue → verify → revoke → deactivate **end to end against testnet**.
- The demo app registers a DID, signs in with a challenge, issues and revokes a credential and shows the badge
  change, covered by a Playwright test (using a throwaway keypair). It is
  [hosted on GitHub Pages](https://stellar-ids.github.io/frontend/), and that hosted build was run through the same
  flow on testnet.
- The [docs site](https://stellar-ids.github.io/docs/) is live and link-checked; its Node quick start was re-run
  verbatim from a clean folder with the npm package.

## What does not work yet

- **Real browser-extension wallets** (Freighter, xBull, …) have not been tested through the SDK or the demo.
- No independent security audit; mainnet unsupported.
- Open contributor work is tracked as Wave issues in each repository (method registration, more proof types,
  revocation lists, resource fees, resolver fallback, wallet connectors, social login, profile editing, theming,
  accessibility audit, more guides). Each repository's `ROADMAP.md` lists them with the maintainer track.

## Working in this monorepo

Each folder builds, tests and lints on its own and never imports from a sibling by path — that is what makes the
four-way split possible.

```bash
# everything
scripts/verify-all.sh            # on Windows: Git Bash

# a single package
cd stellar-id-core     && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test && stellar contract build
cd stellar-id-client   && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`scripts/split.sh` produces the four standalone repositories (`core`, `client`, `frontend`, `docs`) from this
history without modifying it.

Project documents: [`AGENTS.md`](AGENTS.md) (working rules), [`PLAYBOOK.md`](PLAYBOOK.md) (the build plan) and
[`STATUS.md`](STATUS.md) (progress, decisions and pinned versions).

## License

[Apache-2.0](stellar-id-core/LICENSE). Each package carries its own copy; root-level files are not carried over
when the monorepo is split.
