/**
 * Testnet integration suite: full lifecycle against the deployed contract.
 *
 * Run manually (and in the scheduled CI job), never per-PR:
 *   INTEGRATION=1 pnpm vitest run test/integration.test.ts
 *
 * Funds a fresh throwaway account via friendbot on every run so reruns are
 * hermetic. Also serves as Gate 4 evidence (see examples/node-basic).
 */
import { describe, expect, it } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import {
  createIdentity,
  CredentialRevokedError,
  deactivateIdentity,
  issueCredential,
  KeypairSigner,
  resolveIdentity,
  revokeCredential,
  updateIdentity,
  verifyCredential,
} from "../src/index.js";

const RUN = process.env["INTEGRATION"] === "1";
const STEP_TIMEOUT = 300_000;

async function fundedSigner(): Promise<KeypairSigner> {
  const pair = Keypair.random();
  const res = await fetch(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
  if (!res.ok) {
    throw new Error(`friendbot funding failed: ${res.status}`);
  }
  return KeypairSigner.fromSecret(pair.secret());
}

describe.skipIf(!RUN)("testnet lifecycle", () => {
  it(
    "create -> resolve -> update -> anchor -> verify -> revoke -> verify fails -> deactivate",
    async () => {
      const signer = await fundedSigner();
      const address = await signer.publicKey();
      // key-1 is the account key itself, so later issuance verifies.
      const accountKeyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");

      const identity = await createIdentity({
        signer,
        keys: [{ id: "key-1", publicKeyHex: accountKeyHex }],
      });
      expect(identity.did).toBe(`did:stellar:testnet:${address}`);

      const resolved = await resolveIdentity(identity.did);
      expect(resolved.didDocument?.id).toBe(identity.did);
      expect(resolved.didDocumentMetadata?.versionId).toBe(1);

      const extra = Keypair.random().rawPublicKey().toString("hex");
      const updates = await updateIdentity(
        identity.did,
        { addKeys: [{ id: "key-2", publicKeyHex: extra }] },
        { signer },
      );
      expect(updates).toHaveLength(1);
      const updated = await resolveIdentity(identity.did);
      expect(updated.didDocument?.verificationMethod).toHaveLength(2);

      const { credential, hash } = await issueCredential({
        issuerSigner: signer,
        issuerKeyId: "key-1",
        credentialSubject: { id: identity.did, role: "tester" },
        anchor: {},
      });
      const verified = await verifyCredential(credential);
      expect(verified).toMatchObject({ valid: true, hash });

      await revokeCredential(hash, { issuerSigner: signer });
      await expect(verifyCredential(credential)).rejects.toThrow(CredentialRevokedError);

      await deactivateIdentity(identity.did, { signer });
      const tombstone = await resolveIdentity(identity.did);
      expect(tombstone.didResolutionMetadata.error).toBe("deactivated");
    },
    STEP_TIMEOUT,
  );
});
