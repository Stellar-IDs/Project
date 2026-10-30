# demo app

Next.js (App Router) demo for `stellar-id-frontend`, running against Stellar
**testnet only**.

What it does: picks a signer, registers a `did:stellar` DID for it (the
account key becomes `key-1`), signs in with a challenge/response, shows the
profile, issues and anchors a demo credential, revokes it, and shows the
`CredentialBadge` flip from "Valid" to "Revoked".

**Signers:** an auto-funded throwaway keypair (`/?demowallet=1`, friendbot)
or a pasted testnet secret. Browser-extension wallets (Freighter etc. via
`WalletsKitSigner`) are **not wired into this demo yet**.

**Not deployed:** the demo has no public URL yet. Run it locally.

## Run

```bash
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
```

## End-to-end tests (Playwright)

```bash
node node_modules/@playwright/test/cli.js install chromium   # once
pnpm e2e            # offline test + full flow on testnet
pnpm e2e:offline    # skips the @testnet test
```

The full-flow test creates real testnet entries and needs friendbot and the
Soroban testnet RPC to be reachable. Real wallet extensions can't be
automated reliably, so the e2e uses the throwaway keypair.

## Manual check with your own testnet account

1. Create and fund a **testnet-only** account (`stellar keys generate demo
   --network testnet --fund`), then `stellar keys secret demo` to print
   its secret. Never use a mainnet secret here.
2. `pnpm dev`, open http://localhost:3000, paste the secret, and click
   **Use this secret**. The demo registers a DID for it if it has none.
3. Click **Sign in with Stellar** and check that "Signed in as
   did:stellar:testnet:G…" appears.
4. Click **Issue demo credential** and wait for **Valid credential**.
5. Click **Revoke it** and check that the badge changes to **Revoked credential**.
6. Optional: look up the transactions for the account on stellar.expert
   (testnet).
