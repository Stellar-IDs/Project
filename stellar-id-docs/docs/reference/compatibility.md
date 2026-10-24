---
id: compatibility-matrix
title: Compatibility Matrix
sidebar_label: Compatibility Matrix
sidebar_position: 1
---

# Version Compatibility Matrix

| stellar-id-core | stellar-id-client | stellar-id-frontend | stellar-id-docs | Notes |
|---|---|---|---|---|
| 0.1.x (core-v0.1.0) | 0.1.x | 0.1.x | 0.1.x | Testnet contract `CBFXX2...` |

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

## Wallet Support Matrix (Tested)

| Wallet / Signer | Connect | Sign Tx | Sign Message | Notes |
|---|---|---|---|---|
| `KeypairSigner` (secret seed) | n/a | ✅ | ✅ | Node/tests/CI only. Never in browser bundles. |
| `WalletsKitSigner` + Freighter | via kit | ✅ | ⚠️ | Interface-tested (fake kit). Real-wallet flow untested. |
| `WalletsKitSigner` + xBull | via kit | ✅ | ⚠️ | Interface-tested. |
| `WalletsKitSigner` + Albedo | via kit | ✅ | ⚠️ | Interface-tested. |
| `WalletsKitSigner` + LOBSTR | via kit | ✅ | ⚠️ | Interface-tested. |

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