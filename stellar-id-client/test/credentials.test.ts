import { describe, expect, it, vi } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import {
  CredentialExpiredError,
  CredentialRevokedError,
  InvalidProofError,
  issueCredential,
  sha256Hex,
  verifyCredential,
} from "../src/index.js";
import type { DidReader, StatusReader, VerifiableCredential } from "../src/index.js";
import { KeypairSigner } from "../src/index.js";
import type { DidRecord } from "../src/generated/index.js";

vi.mock("../src/gateway.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/gateway.js")>();
  return { ...mod, submitMutation: vi.fn(async () => "TXHASH") };
});

// Throwaway issuer key (never a real key).
const ISSUER_SEED = StrKey.encodeEd25519SecretSeed(Buffer.alloc(32, 11));
const ISSUER = Keypair.fromSecret(ISSUER_SEED);
const ISSUER_HEX = ISSUER.rawPublicKey().toString("hex");
const ISSUER_ADDRESS = ISSUER.publicKey();

function recordWithKey(assertion: string[] = ["key-1"]): DidRecord {
  return {
    controller: ISSUER_ADDRESS,
    verification_methods: [
      {
        id: "key-1",
        kind: "Ed25519",
        public_key: Buffer.from(ISSUER_HEX, "hex"),
      },
    ],
    authentication: ["key-1"],
    assertion_method: assertion,
    services: [],
    created: 1n,
    updated: 1n,
    version: 1,
    deactivated: false,
  };
}

function readerFor(record: DidRecord): DidReader {
  return {
    async resolve() {
      return record;
    },
  };
}

async function issued() {
  const signer = KeypairSigner.fromSecret(ISSUER_SEED);
  return issueCredential({
    issuerSigner: signer,
    issuerKeyId: "key-1",
    credentialSubject: { id: "did:stellar:testnet:GSUBJECT", degree: "Bachelor" },
    id: "http://example.edu/credentials/1",
    network: {
      network: "testnet",
      networkPassphrase: "Test SDF Network ; September 2015",
      rpcUrl: "https://soroban-testnet.stellar.org",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
    },
  });
}

describe("issueCredential", () => {
  it("builds a signed credential with a verifiable hash", async () => {
    const { credential, hash } = await issued();
    expect(credential.issuer).toBe(`did:stellar:testnet:${ISSUER_ADDRESS}`);
    expect(credential.proof.verificationMethod).toContain("#key-1");
    expect(hash).toHaveLength(64);
    // The hash covers the unsigned credential (proof excluded).
    const { proof: _proof, ...unsigned } = credential;
    void _proof;
    const { canonicalize } = await import("../src/index.js");
    expect(sha256Hex(canonicalize(unsigned))).toBe(hash);
  });
});

describe("verifyCredential", () => {
  const active: StatusReader = async () => "Active";

  it("accepts a well-formed anchored credential", async () => {
    const { credential, hash } = await issued();
    const res = await verifyCredential(credential, {
      reader: readerFor(recordWithKey()),
      statusReader: active,
    });
    expect(res).toEqual({ valid: true, did: credential.issuer, hash });
  });

  it("rejects tampered claims", async () => {
    const { credential } = await issued();
    const tampered: VerifiableCredential = {
      ...credential,
      credentialSubject: { id: "did:stellar:testnet:GSUBJECT", degree: "PhD" },
    };
    await expect(
      verifyCredential(tampered, { reader: readerFor(recordWithKey()), statusReader: active }),
    ).rejects.toThrow(InvalidProofError);
  });

  it("rejects keys outside assertionMethod", async () => {
    const { credential } = await issued();
    await expect(
      verifyCredential(credential, { reader: readerFor(recordWithKey([])), statusReader: active }),
    ).rejects.toThrow(InvalidProofError);
  });

  it("maps Revoked / Expired / Unknown statuses", async () => {
    const { credential } = await issued();
    const reader = readerFor(recordWithKey());
    await expect(
      verifyCredential(credential, { reader, statusReader: async () => "Revoked" }),
    ).rejects.toThrow(CredentialRevokedError);
    await expect(
      verifyCredential(credential, { reader, statusReader: async () => "Expired" }),
    ).rejects.toThrow(CredentialExpiredError);
    await expect(
      verifyCredential(credential, { reader, statusReader: async () => "Unknown" }),
    ).rejects.toThrow(InvalidProofError);
  });
});
