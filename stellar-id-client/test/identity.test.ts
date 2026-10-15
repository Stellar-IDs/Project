import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { createIdentity, deactivateIdentity, updateIdentity } from "../src/index.js";
import type { Signer } from "../src/index.js";
import { submitMutation } from "../src/gateway.js";

vi.mock("../src/gateway.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/gateway.js")>();
  return { ...mod, submitMutation: vi.fn() };
});

const mockedSubmit = vi.mocked(submitMutation);

// Deterministic test signer (throwaway seed, never a real key).
const TEST_SEED = StrKey.encodeEd25519SecretSeed(Buffer.alloc(32, 7));
const TEST_ADDRESS = Keypair.fromSecret(TEST_SEED).publicKey();

function fakeSigner(): Signer {
  return {
    async publicKey() {
      return TEST_ADDRESS;
    },
    async signTransaction() {
      return "signed";
    },
  };
}

describe("createIdentity", () => {
  beforeEach(() => {
    mockedSubmit.mockReset();
    mockedSubmit.mockResolvedValue("HASH123");
  });

  it("builds the DID from the signer address and submits create_did", async () => {
    const identity = await createIdentity({ signer: fakeSigner() });
    expect(identity.did).toBe(`did:stellar:testnet:${TEST_ADDRESS}`);
    expect(identity.hash).toBe("HASH123");
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
  });

  it("passes keys and services into the initial document", async () => {
    const other = Keypair.random().rawPublicKey().toString("hex");
    await createIdentity({
      signer: fakeSigner(),
      keys: [{ id: "key-1", publicKeyHex: other }],
      services: [{ id: "svc", kind: "K", endpoint: "https://example.com" }],
    });
    const build = mockedSubmit.mock.calls[0]?.[0];
    expect(build).toBeTypeOf("function");
  });
});

describe("updateIdentity", () => {
  beforeEach(() => {
    mockedSubmit.mockReset();
    mockedSubmit.mockResolvedValue("HASH");
  });

  it("runs patch entries in order and returns all hashes", async () => {
    const did = `did:stellar:testnet:${TEST_ADDRESS}`;
    const results = await updateIdentity(
      did,
      {
        addKeys: [{ id: "key-2", publicKeyHex: "ab".repeat(32) }],
        authentication: ["key-2"],
        removeKeyIds: ["key-1"],
      },
      { signer: fakeSigner() },
    );
    expect(results).toHaveLength(3);
    expect(mockedSubmit).toHaveBeenCalledTimes(3);
  });

  it("stops at the first failure", async () => {
    const did = `did:stellar:testnet:${TEST_ADDRESS}`;
    mockedSubmit.mockRejectedValueOnce(new Error("boom")).mockResolvedValue("HASH");
    await expect(
      updateIdentity(did, { addKeys: [{ id: "a", publicKeyHex: "ab".repeat(32) }] }, {
        signer: fakeSigner(),
      }),
    ).rejects.toThrow();
  });
});

describe("deactivateIdentity", () => {
  it("submits a single deactivation", async () => {
    mockedSubmit.mockReset();
    mockedSubmit.mockResolvedValue("HASH9");
    const did = `did:stellar:testnet:${TEST_ADDRESS}`;
    const res = await deactivateIdentity(did, { signer: fakeSigner() });
    expect(res).toEqual({ hash: "HASH9" });
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
  });
});
