---
id: quickstart-node
title: Quick Start (Node)
sidebar_label: Node.js
sidebar_position: 1
---

# Quick Start: Node.js SDK

Run the identity lifecycle on Stellar **testnet** in about 10 minutes:
create a DID, resolve it, issue a credential, verify it, revoke it.

> **Prerequisites:** Node 20+ and internet access (friendbot + Soroban
> testnet RPC). Testnet only: never use a mainnet secret.

## 1. Set up a project and install

```bash
mkdir stellar-id-quickstart && cd stellar-id-quickstart
npm init -y
npm pkg set type=module
```

`stellar-id-client` is **not published to npm yet**. Until it is, build a
tarball from the source repo and install that:

```bash
# in a checkout of stellar-id-client
pnpm install && pnpm build && pnpm pack   # → stellar-id-client-0.1.0.tgz

# back in stellar-id-quickstart
npm install /path/to/stellar-id-client-0.1.0.tgz @stellar/stellar-sdk@^16.4.1
```

Once it is published, this becomes `npm install stellar-id-client @stellar/stellar-sdk`.

## 2. Create and fund a testnet account

```bash
node -e "const {Keypair}=require('@stellar/stellar-sdk');const k=Keypair.random();console.log('PUBLIC',k.publicKey());console.log('SECRET',k.secret())"
curl "https://friendbot.stellar.org/?addr=G_YOUR_PUBLIC_KEY"
```

Keep the secret out of git: put it in a `.env` file that is gitignored, or
in an environment variable as below.

## 3. Run the lifecycle

Save as `quickstart.mjs`:

```js
import { StrKey } from "@stellar/stellar-sdk";
import {
  KeypairSigner,
  createIdentity,
  issueCredential,
  resolveIdentity,
  revokeCredential,
  verifyCredential,
} from "stellar-id-client";

const signer = KeypairSigner.fromSecret(process.env.STELLAR_SECRET);
const address = await signer.publicKey();

// Register the account key as `key-1`. createIdentity puts initial keys
// in both `authentication` (sign-in) and `assertionMethod` (issuing).
const publicKeyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");
const identity = await createIdentity({ signer, keys: [{ id: "key-1", publicKeyHex }] });
console.log("Created:", identity.did);

const resolved = await resolveIdentity(identity.did);
console.log("Resolved version:", resolved.didDocumentMetadata?.versionId);

// Issue a credential and anchor its hash on-chain (contents stay off-chain).
const { credential, hash } = await issueCredential({
  issuerSigner: signer,
  issuerKeyId: "key-1",
  credentialSubject: { id: identity.did, role: "tester" },
  anchor: {},
});
console.log("Verified:", await verifyCredential(credential));

await revokeCredential(hash, { issuerSigner: signer });
try {
  await verifyCredential(credential);
} catch (err) {
  console.log("After revoke:", err.name); // CredentialRevokedError
}
```

Run it (each on-chain step takes a few seconds):

```bash
STELLAR_SECRET=S... node quickstart.mjs
```

On Windows PowerShell: `$env:STELLAR_SECRET="S..."; node quickstart.mjs`.

Running it twice with the same account fails at `createIdentity` with a
`SimulationError` ("contract rejected the call: AlreadyExists"): one DID per
account. Use a fresh account or skip
that step.

## More

- Adding keys and services: `updateIdentity` in the
  [API reference](../api/overview.md).
- A fuller script (update + deactivate) lives in `examples/node-basic` in
  the `stellar-id-client` repo.

## Testnet notes

- Contract: `CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT`
- RPC: `https://soroban-testnet.stellar.org`
- Network passphrase: `Test SDF Network ; September 2015`
- Testnet is reset periodically; after a reset the contract is redeployed
  under a new ID and the SDK's bindings are updated.

---

**Next:** [Quick Start (React)](../quickstart/react.md) or
[API Reference](../api/overview.md)
