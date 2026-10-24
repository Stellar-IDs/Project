---
id: quickstart-node
title: Quick Start (Node)
sidebar_label: Node.js
sidebar_position: 1
---

# Quick Start: Node.js SDK

Run the full identity lifecycle on Stellar testnet in ~10 minutes.

> **Prerequisites:** Node 20+, a funded Stellar testnet account.

## 1. Install

```bash
pnpm add stellar-id-client @stellar/stellar-sdk
# or: npm install stellar-id-client @stellar/stellar-sdk
```

## 2. Fund a Testnet Account

If you don't have one:

```bash
# Generate a secret (SAVE THIS — testnet only!)
npx -y @stellar/stellar-sdk keypair
# → Secret: S...  Public: G...

# Fund via friendbot
curl "https://friendbot.stellar.org/?addr=G_YOUR_ADDRESS"
```

## 3. Create Your Identity

```ts
// create-identity.ts
import { KeypairSigner, createIdentity, resolveIdentity } from "stellar-id-client";

const secret = process.env.STELLAR_SECRET!; // S...
const signer = KeypairSigner.fromSecret(secret);

const identity = await createIdentity({ signer });
console.log("Created:", identity.did); // did:stellar:testnet:G...

const resolved = await resolveIdentity(identity.did);
console.log("Resolved:", resolved.didDocument);
```

Run it:
```bash
STELLAR_SECRET=S... node --loader=ts-node/esm create-identity.ts
```

## 4. Add a Verification Method

```ts
import { updateIdentity } from "stellar-id-client";
import { Keypair } from "@stellar/stellar-sdk";

const extra = Keypair.random().rawPublicKey().toString("hex");
await updateIdentity(identity.did, { addKeys: [{ id: "key-2", publicKeyHex: extra }] }, { signer });
```

## 5. Issue & Verify a Credential

```ts
import { issueCredential, verifyCredential } from "stellar-id-client";

const { credential, hash, anchorTx } = await issueCredential({
  issuerSigner: signer,
  issuerKeyId: "key-1",
  credentialSubject: { id: identity.did, role: "tester" },
  anchor: {}, // puts hash on-chain for revocation/expiry status
});
console.log("Anchored:", anchorTx);

const verified = await verifyCredential(credential);
console.log(verified); // { valid: true, did: "...", hash: "..." }
```

## 6. Revoke It

```ts
import { revokeCredential } from "stellar-id-client";

await revokeCredential(hash, { issuerSigner: signer });
await verifyCredential(credential); // throws CredentialRevokedError
```

## Complete Example

See `examples/node-basic` in the `stellar-id-client` repo — it runs the
full create → resolve → update → issue → verify → revoke → deactivate
flow against testnet.

## Testnet Notes

- Contract: `CBFXX2HCWDIQR45XNPLIMADAKO3N2EXMHJWSGNGNMJQR67TKZ4SCTXXE`
- RPC: `https://soroban-testnet.stellar.org`
- Network passphrase: `Test SDF Network ; September 2015`
- Secrets go in `.env` (gitignored). Never commit real secrets.

---

**Next:** [Quick Start (React)](../quickstart/react.md) or
[API Reference](../api/overview.md)