import { describe, expect, it } from "vitest";
import type { DidReader } from "../src/index.js";
import {
  DidNotFoundError,
  DidParseError,
  NetworkError,
  resolveIdentity,
} from "../src/index.js";
import type { DidRecord } from "../src/generated/index.js";

const ADDRESS = "GA2DO5BZPTPE4OPB46XXZF37VGIJXG7D535QU4GWYJLZYISSXOZKKF4M";
const DID = `did:stellar:testnet:${ADDRESS}`;

function liveRecord(): DidRecord {
  return {
    controller: ADDRESS,
    verification_methods: [],
    authentication: [],
    assertion_method: [],
    services: [],
    created: 10n,
    updated: 20n,
    version: 3,
    deactivated: false,
  };
}

describe("resolveIdentity", () => {
  it("resolves a live DID to a document", async () => {
    const reader: DidReader = {
      async resolve(address: string) {
        expect(address).toBe(ADDRESS);
        return liveRecord();
      },
    };
    const res = await resolveIdentity(DID, { reader });
    expect(res.didDocument?.id).toBe(DID);
    expect(res.didResolutionMetadata.error).toBeUndefined();
    expect(res.didDocumentMetadata).toMatchObject({ versionId: 3 });
  });

  it("maps missing DIDs to DidNotFoundError", async () => {
    const reader: DidReader = {
      async resolve() {
        throw new DidNotFoundError(DID);
      },
    };
    await expect(resolveIdentity(DID, { reader })).rejects.toThrow(DidNotFoundError);
  });

  it("resolves deactivated DIDs to tombstones", async () => {
    const reader: DidReader = {
      async resolve() {
        return { ...liveRecord(), deactivated: true };
      },
    };
    const res = await resolveIdentity(DID, { reader });
    expect(res.didResolutionMetadata.error).toBe("deactivated");
    expect(res.didDocument?.verificationMethod).toEqual([]);
    expect(res.didDocumentMetadata?.deactivated).toBe(true);
  });

  it("rejects malformed DIDs before any IO", async () => {
    const reader: DidReader = {
      async resolve(): Promise<DidRecord> {
        throw new Error("must not be called");
      },
    };
    await expect(resolveIdentity("did:stellar:testnet:bogus", { reader })).rejects.toThrow(
      DidParseError,
    );
  });

  it("surfaces transport failures as NetworkError", async () => {
    const reader: DidReader = {
      async resolve(): Promise<DidRecord> {
        throw new NetworkError("fetch failed");
      },
    };
    await expect(resolveIdentity(DID, { reader })).rejects.toThrow(NetworkError);
  });
});
