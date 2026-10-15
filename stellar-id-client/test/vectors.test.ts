import { describe, expect, it } from "vitest";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import vectors from "./fixtures/test-vectors.json" with { type: "json" };
import { canonicalize, sha256Hex } from "../src/index.js";

// NOTE: test/fixtures/test-vectors.json is a committed copy of
// stellar-id-core/docs/test-vectors.json (no cross-package imports allowed).
// If the core file changes, re-copy it and re-run this suite.

interface JcsVector {
  input: unknown;
  canonical: string;
  sha256: string;
}

interface SigVector {
  public_key_hex?: string;
  message_hex: string;
  signature_hex: string;
  valid: boolean;
}

describe("cross-language vectors", () => {
  it("canonicalizes the shared credential byte-identically (JCS)", () => {
    for (const v of vectors.jcs_canonicalization as JcsVector[]) {
      expect(canonicalize(v.input)).toBe(v.canonical);
      expect(sha256Hex(v.canonical)).toBe(v.sha256);
    }
  });

  it("verifies the shared Ed25519 vectors", () => {
    for (const v of vectors.ed25519_sign_verify as SigVector[]) {
      if (v.public_key_hex === undefined) {
        continue;
      }
      const key = Keypair.fromPublicKey(StrKey.encodeEd25519PublicKey(
        Buffer.from(v.public_key_hex, "hex"),
      ));
      const ok = key.verify(
        Buffer.from(v.message_hex, "hex"),
        Buffer.from(v.signature_hex, "hex"),
      );
      expect(ok).toBe(v.valid);
    }
  });

  it("canonicalizes nested and unordered input deterministically", () => {
    const a = canonicalize({ z: 1, a: { y: [3, 2], x: null } });
    expect(a).toBe('{"a":{"x":null,"y":[3,2]},"z":1}');
  });
});
