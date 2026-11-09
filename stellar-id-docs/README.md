<div align="center">

# Stellar ID — Documentation

**The documentation site for the Stellar ID suite: concepts, quick starts, API references and security guidance for `did:stellar` identity on Stellar.**

[![CI](https://github.com/Stellar-IDs/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-IDs/docs/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Network](https://img.shields.io/badge/network-testnet-orange)
[![Deploy](https://github.com/Stellar-IDs/docs/actions/workflows/deploy.yml/badge.svg)](https://github.com/Stellar-IDs/docs/actions/workflows/deploy.yml)
![Status](https://img.shields.io/badge/status-v0.x-yellow)

**[Live site](https://stellar-ids.github.io/docs/)** · [Live demo](https://stellar-ids.github.io/frontend/) · [Core contract](https://github.com/Stellar-IDs/core) · [Client SDK](https://github.com/Stellar-IDs/client) · [Frontend](https://github.com/Stellar-IDs/frontend) · [Changelog](CHANGELOG.md)

</div>

> **Status — read this first.** The site is live at **https://stellar-ids.github.io/docs/**, deployed from `main`
> by `.github/workflows/deploy.yml` (GitHub Pages); you can also build and preview it locally (below). Every
> guide targets **Stellar testnet** and is written to describe only what is implemented and tested. Where
> something is untested — for example the real-wallet path in the React quick start — the page says so.

---

## Table of contents

1. [What this is](#what-this-is)
2. [What the site covers](#what-the-site-covers)
3. [Run it locally](#run-it-locally)
4. [Writing and reviewing docs](#writing-and-reviewing-docs)
5. [Project layout](#project-layout)
6. [Keeping docs honest](#keeping-docs-honest)
7. [Implemented, and not yet](#implemented-and-not-yet)
8. [Windows note](#windows-note)
9. [The Stellar ID suite](#the-stellar-id-suite)
10. [Contributing, security and license](#contributing-security-and-license)

---

## What this is

A [Docusaurus 3](https://docusaurus.io) site (MDX, built with the Rspack-based `@docusaurus/faster` bundler)
that documents the whole Stellar ID suite in one place:

- [`core`](https://github.com/Stellar-IDs/core) — the Soroban contract,
- [`client`](https://github.com/Stellar-IDs/client) — the TypeScript SDK,
- [`frontend`](https://github.com/Stellar-IDs/frontend) — the React components and hooks.

It is written for application developers who want to add decentralized sign-in or verifiable credentials
to an app, and for contributors who need to understand how the pieces fit together.

## What the site covers

| Section | Pages | What you learn |
|---|---|---|
| **Introduction** | `intro` | What the suite is, what works today, what is untested |
| **Concepts** | `concepts/overview` | DIDs, the `did:stellar` method, credentials, revocation, Soroban TTL and fees |
| **Quick start** | `quickstart/node`, `quickstart/react` | A full DID and credential lifecycle in Node; the React sign-in flow |
| **API reference** | `api/overview`, `api/contract`, `api/frontend` | The SDK surface, every contract function, and the React components and hooks |
| **Security** | `security/basics` | Secrets, server-side verification, replay protection, what the chain exposes |
| **Migration** | `migration/from-auth` | Moving from password / OAuth sign-in to challenge/response |
| **Reference** | `reference/compatibility`, `reference/contributing` | Version compatibility matrix and how to contribute |

The Node quick start has been **run verbatim from a clean folder against testnet** with a packed client
tarball. The React quick start's real-wallet path has not been tested, and says so.

## Run it locally

Requires Node 20 or newer and [pnpm](https://pnpm.io).

```bash
pnpm install --frozen-lockfile
pnpm dev          # live-reloading preview at http://localhost:3000
```

Production build (also serves as the link checker — it **fails on any broken link**):

```bash
pnpm build
pnpm serve        # preview the static output
```

## Writing and reviewing docs

```bash
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit (config and sidebars)
pnpm test         # config smoke tests
pnpm build        # must pass: broken links fail the build
```

Style rules, in short:

- State the network (testnet) on any page that runs code.
- Reference **published package names** (`stellar-id-client`, `stellar-id-frontend`), never paths inside the
  monorepo.
- Code samples must match the tested examples; if you change a sample, re-run it.
- Don't describe a feature that isn't implemented. Mark planned work as planned.

## Project layout

```
docs/
├── intro.md
├── concepts/overview.md
├── quickstart/        # node.md, react.md
├── api/               # overview.md, contract.md, frontend.md
├── security/basics.md
├── migration/from-auth.md
└── reference/         # compatibility.md, contributing.md
src/
├── css/custom.css
└── pages/index.tsx    # landing page
docusaurus.config.ts   # site config (GitHub Pages url, /docs/ base path)
sidebars.ts            # navigation
test/                  # config smoke tests
.github/workflows/      # ci.yml (verify), deploy.yml (GitHub Pages)
```

## Keeping docs honest

The documentation depends on three moving parts, and drift between them is the main risk:

1. **The contract** — function names, errors and limits in `api/contract` must match
   [`core`](https://github.com/Stellar-IDs/core) (`docs/METHOD_SPEC.md` is the source of truth).
2. **The SDK** — signatures in the quick starts must match the `client` examples that are run against testnet.
3. **The compatibility matrix** — `reference/compatibility` records which versions work together and which
   testnet contract the SDK's bindings target. Update it whenever a package version or the deployment changes.

Code samples are currently maintained **by hand**; pulling them automatically from the tested examples is a
known gap.

## Implemented, and not yet

**Implemented and tested:** the pages above, a link-checked production build, lint, typecheck and config smoke tests.

**Not yet — planned as open contributor issues:**

| Issue | Idea |
|---|---|
| docs-1 | Full React integration guide |
| docs-2 | Vue integration guide (using the SDK directly) |
| docs-3 | Full-stack example: frontend + backend + contract |
| docs-4 | Security best-practices guide |

**Also not present:** hosting, versioned docs, site search, and automatic code-sample syncing.

## Windows note

If the build fails with `ERR_SWC_NATIVE_CACHE`, the SWC native loader is rejecting the default cache
directory (it checks ancestor folders' permissions, which can fail on machines with several local accounts).
Point it at a directory only your user can write to:

```powershell
$env:SWC_NATIVE_BINDING_CACHE = "C:\swc-native-cache"
```

Linux and macOS are unaffected, and CI runs on Linux.

## The Stellar ID suite

| Repository | Role |
|---|---|
| [core](https://github.com/Stellar-IDs/core) | Soroban contract |
| [client](https://github.com/Stellar-IDs/client) | TypeScript SDK |
| [frontend](https://github.com/Stellar-IDs/frontend) | React components and hooks |
| **[docs](https://github.com/Stellar-IDs/docs)** (this repo) | Documentation site |

## Contributing, security and license

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Vulnerabilities go through [SECURITY.md](SECURITY.md).

Licensed under the [Apache License 2.0](LICENSE).
