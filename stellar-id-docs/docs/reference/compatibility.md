---
id: compatibility-matrix
title: Compatibility Matrix
sidebar_label: Compatibility Matrix
sidebar_position: 1
---

# Version Compatibility Matrix

| stellar-id-core | stellar-id-client | stellar-id-frontend | stellar-id-docs | Notes |
|---|---|---|---|---|
| 0.1.0 (unreleased) | 0.1.0 (unpublished) | 0.1.0 (unpublished) | 0.1.0 | Testnet contract `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT` |

Nothing is released yet: there is no npm package and no final core tag.
The client's vendored bindings target the contract above.

## Contract → SDK Coupling

The SDK uses **generated TypeScript bindings** (vendored in
`src/generated/`) produced by `stellar contract bindings typescript`
against the deployed contract. On every contract change:

1. Regenerate: `./scripts/sync-bindings.sh`
2. Commit the updated `stellar-id-client/src/generated/index.ts`
3. Bump `stellar-id-client` version
4. Update `stellar-id-frontend` to the new client version

## Network Passphrases

| Network | Passphrase |
|---|---|
| Testnet | `Test SDF Network ; September 2015` |
| Public (mainnet) | `Public Global Stellar Network ; September 2015` |

## RPC Endpoints

| Network | Endpoint |
|---|---|
| Testnet | `https://soroban-testnet.stellar.org` |
| Public | (not yet defined for v1) |

## Signer support (what has actually been tested)

| Signer | Sign tx | Sign message | How it was tested |
|---|---|---|---|
| `KeypairSigner` (secret seed) | ✅ | ✅ | Live on testnet: client integration test, Node quick start, demo e2e (throwaway key). Node, tests and throwaway testnet keys only. |
| `WalletsKitSigner` (any wallet) | Untested live | Untested live | Unit tests against a fake kit only. No real wallet (Freighter, xBull, Albedo, LOBSTR…) has been tried yet. |

**Message signing support varies by wallet.** The SDK's
`WalletsKitSigner.signMessage` throws `WalletError` when the
connected wallet doesn't implement it. Handle gracefully.

## React Version

| stellar-id-frontend | React Peer Dependency |
|---|---|
| 0.1.x | `^18.0.0 \|\| ^19.0.0` |

## Next.js

| stellar-id-frontend | Next.js |
|---|---|
| 0.1.x | 16.x (App Router) |

## Breaking Changes

- **Contract redeploy** = new contract ID + new WASM hash → SDK minor/major bump.
- **Binding regen** = if method signatures change → SDK minor bump.
- **CSS variable rename** = frontend major bump.

---

**Next:** [Contributing](../reference/contributing.md)