"use client";

/**
 * Demo credential lifecycle: ensure the DID exists (registering the
 * account key as `key-1` so issuance verifies), issue + anchor a demo
 * credential, show the badge, revoke, and show the badge flip.
 */
import { useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { CredentialBadge, useIdentity } from "stellar-id-frontend";
import {
  canonicalize,
  createIdentity,
  issueCredential,
  resolveIdentity,
  revokeCredential,
  sha256Hex,
} from "stellar-id-client";
import type { Signer, VerifiableCredential } from "stellar-id-client";

type Phase = "idle" | "working" | "ready" | "revoked" | "failed";

/**
 * Credential demo panel (visible once signed in).
 *
 * @param signer - The connected demo signer.
 */
export function CredentialPanel({ signer }: { signer: Signer }): React.JSX.Element {
  const { did, address } = useIdentity();
  const [phase, setPhase] = useState<Phase>("idle");
  const [credential, setCredential] = useState<VerifiableCredential | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const run = async (): Promise<void> => {
    if (address === null) {
      return;
    }
    setPhase("working");
    setNote(null);
    try {
      // Ensure an on-chain DID with the account key as key-1.
      const accountKeyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");
      try {
        await resolveIdentity(`did:stellar:testnet:${address}`);
      } catch {
        await createIdentity({
          signer,
          keys: [{ id: "key-1", publicKeyHex: accountKeyHex }],
        });
      }
      const issued = await issueCredential({
        issuerSigner: signer,
        issuerKeyId: "key-1",
        credentialSubject: { id: did ?? `did:stellar:testnet:${address}`, role: "demo-tester" },
        anchor: {},
      });
      setCredential(issued.credential);
      setPhase("ready");
      setNote(`Anchored ${issued.hash.slice(0, 12)}…`);
    } catch (err) {
      setPhase("failed");
      setNote(err instanceof Error ? err.message : String(err));
    }
  };

  const revoke = async (): Promise<void> => {
    if (credential === null) {
      return;
    }
    setPhase("working");
    try {
      const { proof: _proof, ...unsigned } = credential;
      void _proof;
      await revokeCredential(sha256Hex(canonicalize(unsigned)), { issuerSigner: signer });
      setRefreshToken((n) => n + 1);
      setPhase("revoked");
    } catch (err) {
      setPhase("failed");
      setNote(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section aria-label="Demo credential">
      <h2>Demo credential</h2>
      {phase === "idle" && (
        <button type="button" onClick={() => void run()}>
          Issue demo credential
        </button>
      )}
      {phase === "working" && <p role="status">Working…</p>}
      {(phase === "ready" || phase === "revoked") && credential !== null && (
        <div>
          <CredentialBadge credential={credential} refreshToken={refreshToken} />
          {phase === "ready" && (
            <button type="button" onClick={() => void revoke()}>
              Revoke it
            </button>
          )}
        </div>
      )}
      {phase === "failed" && (
        <p role="alert">Failed: {note}</p>
      )}
      {note !== null && phase !== "failed" && <p>{note}</p>}
    </section>
  );
}
