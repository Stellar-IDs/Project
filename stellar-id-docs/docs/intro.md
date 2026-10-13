---
id: intro
title: Introduction
sidebar_position: 0
---

# Stellar Identity & Authentication Suite

**Status: Phase 0 scaffold — testnet only, v0.x.**

A standard, reusable identity layer for Stellar: a Soroban contract implementing the
`did:stellar` DID method, a TypeScript SDK that hides XDR and Soroban complexity,
React components that make identity-aware apps easy, and documentation that gets a
developer from zero to a working integration.

## What's coming (PLAYBOOK phases)

1. `did:stellar` DID method on Soroban (contract): create, resolve, update, deactivate DIDs, verification methods, services.
2. Verifiable credentials: off-chain JSON, issuer-signed SHA-256 hashes, on-chain anchoring and revocation.
3. TypeScript SDK: `createIdentity()`, `resolveIdentity()`, `verifyCredential()`, sign-in challenges, wallet adapters.
4. React components: `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, hooks, `withAuth`.
5. Quick-starts, API reference, and best practices.

## Right now

This site is the Phase 0 scaffold: structure, tooling, and CI are green, but the
guides and API reference are written in Phases 4–6. Check the monorepo `PLAYBOOK.md`
for the build plan, and `STATUS.md` for live progress.

## Testnet only

Everything in this suite targets **Stellar testnet**. Nothing here is for mainnet
use, and no real credentials or secrets belong in these docs.
