/**
 * End-to-end stellar-id-client flow on testnet:
 * create -> resolve -> update -> issue/anchor -> verify -> revoke ->
 * verify fails -> deactivate.
 *
 * Prerequisites: `pnpm build` in stellar-id-client, then
 *   STELLAR_ID_SECRET=S... node run.mjs
 * Fund the secret's account first (friendbot):
 *   https://friendbot.stellar.org/?addr=G...
 * Never commit the secret. See .env.example for the .env variant.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StrKey } from "@stellar/stellar-sdk";
import {
  createIdentity,
  deactivateIdentity,
  issueCredential,
  KeypairSigner,
  resolveIdentity,
  revokeCredential,
  updateIdentity,
  verifyCredential,
} from "../../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no dependency): KEY=VALUE lines, ignores # comments.
function loadEnvFile() {
  let text;
  try {
    text = readFileSync(join(here, ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq > 0 && process.env[trimmed.slice(0, eq)] === undefined) {
      process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  }
}

loadEnvFile();
const secret = process.env["STELLAR_ID_SECRET"];
if (secret === undefined || !secret.startsWith("S")) {
  console.error("Set STELLAR_ID_SECRET=S... (funded testnet account) or create .env from .env.example.");
  process.exit(1);
}

const signer = KeypairSigner.fromSecret(secret);
const step = (n, msg) => console.log(`\n[${n}] ${msg}`);

// key-1 is the account key itself, so later issuance verifies on-chain.
const address = await signer.publicKey();
const accountKeyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");
const identity = await createIdentity({ signer, keys: [{ id: "key-1", publicKeyHex: accountKeyHex }] });
step(1, `created ${identity.did} in ${identity.hash}`);

const resolved = await resolveIdentity(identity.did);
step(2, `resolved version ${resolved.didDocumentMetadata.versionId}`);

await updateIdentity(identity.did, { addServices: [{ id: "demo", kind: "Demo", endpoint: "https://example.com/demo" }] }, { signer });
step(3, "added demo service");

const { credential, hash, anchorTx } = await issueCredential({
  issuerSigner: signer,
  credentialSubject: { id: identity.did, role: "demo-tester" },
  anchor: {},
});
step(4, `issued credential ${hash} (anchor tx ${anchorTx})`);

const verified = await verifyCredential(credential);
step(5, `verified: ${JSON.stringify(verified)}`);

await revokeCredential(hash, { issuerSigner: signer });
try {
  await verifyCredential(credential);
  console.error("ERROR: revoked credential still verifies");
  process.exit(1);
} catch (err) {
  step(6, `revoked; verify now fails with ${err.code}`);
}

await deactivateIdentity(identity.did, { signer });
const tombstone = await resolveIdentity(identity.did);
step(7, `deactivated; resolution reports ${tombstone.didResolutionMetadata.error}`);

console.log("\nFull lifecycle completed on testnet.");
