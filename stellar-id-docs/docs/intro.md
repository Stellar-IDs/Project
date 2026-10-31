---
id: intro
title: Introduction
sidebar_position: 0
---

# Stellar Identity & Authentication Suite

**Status: testnet only, v0.x, unaudited. Packages are not published to npm yet.**

A reusable identity layer for Stellar, in four repositories:

| Repository | What it is |
|---|---|
| `stellar-id-core` | Soroban contract for the `did:stellar` DID method: DID documents keyed by Stellar address, plus credential-hash anchoring and revocation |
| `stellar-id-client` | TypeScript SDK: create, resolve and update DIDs; issue, verify and revoke credentials; challenge/response sign-in |
| `stellar-id-frontend` | React components and hooks: `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, `withAuth` |
| `stellar-id-docs` | This site |

## What works today

- The contract is deployed on testnet with its full DID and credential
  lifecycle (see [Contract API](./api/contract.md)).
- The SDK runs that lifecycle end to end against testnet. The
  [Node quick start](./quickstart/node.md) has been run verbatim from a
  clean folder.
- The frontend demo runs DID registration, sign-in, credential issuance and
  revocation on testnet, with a throwaway keypair as the signer, under a
  Playwright test.

## Not yet

Real extension-wallet sign-in hasn't been verified, the demo and this site
aren't hosted, there's been no independent security audit, and mainnet is
out of scope for v1.

## Testnet only

Everything in this suite targets **Stellar testnet**. Nothing here is for
mainnet use, and no real credentials or secrets belong in these docs.
