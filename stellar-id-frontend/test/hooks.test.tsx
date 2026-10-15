import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCredential, useDidDocument } from "../src/index.js";
import type { VerifiableCredential } from "stellar-id-client";

const DID = "did:stellar:testnet:GTESTADDRESS";

function documentResult() {
  return {
    did: DID,
    didDocument: {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: DID,
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      service: [],
    },
    didResolutionMetadata: { contentType: "application/did+ld+json" as const },
    didDocumentMetadata: {
      created: 1,
      updated: 1,
      versionId: 1,
      method: { stellarAccount: "GTESTADDRESS" },
    },
  };
}

describe("useDidDocument", () => {
  it("stays idle for null DID", () => {
    const { result } = renderHook(() => useDidDocument(null));
    expect(result.current).toMatchObject({ data: null, status: "idle" });
  });

  it("resolves and caches", async () => {
    const did = `${DID}-cache`;
    let calls = 0;
    const resolve = async () => {
      calls += 1;
      return { ...documentResult(), did };
    };
    const { result } = renderHook(() => useDidDocument(did, { resolve }));
    expect(result.current.status).toBe("loading");
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("success");
    expect(result.current.data?.did).toBe(did);
    expect(calls).toBe(1);
  });

  it("reports errors and refetches", async () => {
    const did = `${DID}-retry`;
    let calls = 0;
    const resolve = async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("down");
      }
      return { ...documentResult(), did };
    };
    const { result } = renderHook(() => useDidDocument(did, { resolve }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).not.toBeNull();
    act(() => {
      result.current.refetch();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("success");
    expect(calls).toBe(2);
  });
});

describe("useCredential", () => {
  const credential = {
    proof: { signatureHex: "aa" },
  } as unknown as VerifiableCredential;

  it("verifies and reports status", async () => {
    const { result } = renderHook(() =>
      useCredential(credential, {
        verify: async () => ({ valid: true as const, did: "d", hash: "h" }),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toMatchObject({ status: "success" });
    expect(result.current.data?.valid).toBe(true);
  });

  it("stays idle for null credential", () => {
    const { result } = renderHook(() => useCredential(null));
    expect(result.current.status).toBe("idle");
  });
});
