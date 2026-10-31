**Title:** Wallet connector integration: real-wallet support and capability detection

## Summary
`WalletsKitSigner` exists but has only been tested against a fake kit. Verify
and harden it with real wallets, add capability detection (message signing
support varies), and support auth-entry signing for smart-wallet flows.

## Background
- `src/signers.ts`: `Signer`, `KeypairSigner`, `WalletsKitSigner` (search `TODO(wave: client-2)`).
- `signMessage` uses a base64 round-trip (Freighter convention), unverified with a real wallet.
- Sign-in (`src/challenge.ts`) needs `signMessage`; transactions need `signTransaction`.

## Scope
- [ ] Manual test with at least Freighter and one other wallet on testnet; record results
- [ ] Capability detection API (e.g. `supportsMessageSigning`) with typed `WalletError`s
- [ ] Auth-entry signing for smart-wallet / contract-account flows
- [ ] Update the README signer matrix with what was actually tested

## Out of scope
- New UI components (frontend issue)

## Acceptance criteria
- [ ] Unit tests (fake kit) for each capability path, happy and failure
- [ ] Manual test notes committed (wallet, version, result)
- [ ] Verify command passes

## How to test locally
```bash
pnpm test
```

**Points:** 3 · **Labels:** wave, area:sdk, area:wallets
