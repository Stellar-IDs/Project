import { describe, expect, it } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import {
  createChallenge,
  challengeBytes,
  InMemoryNonceStore,
  InvalidProofError,
  verifyChallengeResponse,
} from "../src/index.js";
import type { DidReader } from "../src/index.js";
import { KeypairSigner } from "../src/index.js";
import type { DidRecord } from "../src/generated/index.js";

const USER_SEED = StrKey.encodeEd25519SecretSeed(Buffer.alloc(32, 13));
const USER = Keypair.fromSecret(USER_SEED);
const USER_HEX = USER.rawPublicKey().toString("hex");
const USER_ADDRESS = USER.publicKey();

function userRecord(): DidRecord {
  return {
    controller: USER_ADDRESS,
    verification_methods: [
      { id: "key-1", kind: "Ed25519", public_key: Buffer.from(USER_HEX, "hex") },
    ],
    authentication: ["key-1"],
    assertion_method: [],
    services: [],
    created: 1n,
    updated: 1n,
    version: 1,
    deactivated: false,
  };
}

const reader: DidReader = {
  async resolve() {
    return userRecord();
  },
};

async function signedResponse(domain = "example.com", address = USER_ADDRESS) {
  const signer = KeypairSigner.fromSecret(USER_SEED);
  const challenge = createChallenge({ domain, address });
  const sig = await signer.signMessage(challengeBytes(challenge));
  return {
    challenge,
    address,
    signatureHex: Buffer.from(sig).toString("hex"),
    domain,
  };
}

describe("createChallenge", () => {
  it("creates unique expiring challenges", () => {
    const a = createChallenge({ domain: "example.com" });
    const b = createChallenge({ domain: "example.com" });
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.expiresAt).toBeGreaterThan(a.issuedAt);
  });
});

describe("verifyChallengeResponse", () => {
  it("authenticates a valid wallet signature", async () => {
    const resp = await signedResponse();
    const auth = await verifyChallengeResponse(resp, {
      reader,
      nonceStore: new InMemoryNonceStore(),
    });
    expect(auth).toEqual({
      did: `did:stellar:testnet:${USER_ADDRESS}`,
      address: USER_ADDRESS,
    });
  });

  it("rejects domain mismatch, expiry, and replay", async () => {
    const resp = await signedResponse();
    await expect(verifyChallengeResponse({ ...resp, domain: "evil.com" }, { reader })).rejects.toThrow(
      InvalidProofError,
    );

    const expired = await signedResponse();
    await expect(
      verifyChallengeResponse(expired, { reader, nowSeconds: expired.challenge.expiresAt + 1 }),
    ).rejects.toThrow(InvalidProofError);

    const store = new InMemoryNonceStore();
    const replay = await signedResponse();
    await verifyChallengeResponse(replay, { reader, nonceStore: store });
    await expect(verifyChallengeResponse(replay, { reader, nonceStore: store })).rejects.toThrow(
      InvalidProofError,
    );
  });

  it("rejects signatures from unknown keys", async () => {
    const other = Keypair.random();
    const challenge = createChallenge({ domain: "example.com", address: USER_ADDRESS });
    const sig = other.sign(Buffer.from(challengeBytes(challenge)));
    await expect(
      verifyChallengeResponse(
        {
          challenge,
          address: USER_ADDRESS,
          signatureHex: Buffer.from(sig).toString("hex"),
          domain: "example.com",
        },
        { reader },
      ),
    ).rejects.toThrow(InvalidProofError);
  });
});
