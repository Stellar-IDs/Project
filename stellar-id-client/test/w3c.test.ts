import { describe, expect, it } from "vitest";
import type { DidRecord } from "../src/generated/index.js";
import {
  multibaseToPublicKeyHex,
  publicKeyToMultibase,
  toW3CDocument,
} from "../src/index.js";

const PUBKEY_HEX = "197f6b23e16c8532c6abc838facd5ea789be0c76b2920334039bfa8b3d368d61";
const DID = "did:stellar:testnet:GABC";

function record(overrides?: Partial<DidRecord>): DidRecord {
  return {
    controller: "GABC",
    verification_methods: [
      { id: "key-1", kind: "Ed25519", public_key: Buffer.from(PUBKEY_HEX, "hex") },
    ],
    authentication: ["key-1"],
    assertion_method: ["key-1"],
    services: [{ id: "svc-1", kind: "TestKind", endpoint: "https://example.com/svc" }],
    created: 100n,
    updated: 200n,
    version: 2,
    deactivated: false,
    ...overrides,
  };
}

describe("publicKeyToMultibase", () => {
  it("encodes with z-prefix and round-trips", () => {
    const multibase = publicKeyToMultibase(PUBKEY_HEX);
    expect(multibase.startsWith("z")).toBe(true);
    expect(multibaseToPublicKeyHex(multibase)).toBe(PUBKEY_HEX);
  });

  it("rejects wrong-length keys and non-multibase input", () => {
    expect(() => publicKeyToMultibase("abcd")).toThrow();
    expect(() => multibaseToPublicKeyHex("6Mk...")).toThrow();
  });
});

describe("toW3CDocument", () => {
  it("renders a full document", () => {
    const doc = toW3CDocument(record(), DID);
    expect(doc.id).toBe(DID);
    expect(doc["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(doc.verificationMethod).toHaveLength(1);
    expect(doc.verificationMethod[0]).toMatchObject({
      id: `${DID}#key-1`,
      type: "Multikey",
      controller: DID,
    });
    expect(doc.authentication).toEqual([`${DID}#key-1`]);
    expect(doc.assertionMethod).toEqual([`${DID}#key-1`]);
    expect(doc.service).toEqual([
      { id: `${DID}#svc-1`, type: "TestKind", serviceEndpoint: "https://example.com/svc" },
    ]);
  });

  it("renders a tombstone for deactivated DIDs", () => {
    const doc = toW3CDocument(record({ deactivated: true }), DID);
    expect(doc.id).toBe(DID);
    expect(doc.verificationMethod).toEqual([]);
    expect(doc.service).toEqual([]);
  });

  it("rejects relationships referencing unknown keys", () => {
    expect(() => toW3CDocument(record({ authentication: ["key-99"] }), DID)).toThrow();
  });
});
