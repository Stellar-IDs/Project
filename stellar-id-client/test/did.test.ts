import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { DidParseError, formatDid, parseDid } from "../src/index.js";

const ADDRESS = "GA2DO5BZPTPE4OPB46XXZF37VGIJXG7D535QU4GWYJLZYISSXOZKKF4M";

describe("parseDid", () => {
  it("parses a valid testnet DID", () => {
    expect(parseDid(`did:stellar:testnet:${ADDRESS}`)).toEqual({
      method: "stellar",
      network: "testnet",
      address: ADDRESS,
    });
  });

  it("parses a public DID", () => {
    const parsed = parseDid(`did:stellar:public:${ADDRESS}`);
    expect(parsed.network).toBe("public");
  });

  it("rejects unknown methods", () => {
    expect(() => parseDid(`did:example:testnet:${ADDRESS}`)).toThrow(DidParseError);
  });

  it("rejects unknown networks", () => {
    expect(() => parseDid(`did:stellar:futurenet:${ADDRESS}`)).toThrow(DidParseError);
  });

  it("rejects bad checksums and junk", () => {
    expect(() => parseDid(`did:stellar:testnet:GABC`)).toThrow(DidParseError);
    expect(() => parseDid(`did:stellar:testnet:${ADDRESS} `)).toThrow(DidParseError);
    expect(() => parseDid(`did:stellar:testnet:${ADDRESS.toLowerCase()}`)).toThrow(
      DidParseError,
    );
    expect(() => parseDid("")).toThrow(DidParseError);
  });

  it("round-trips generated addresses", () => {
    const fresh = Keypair.random().publicKey();
    expect(parseDid(`did:stellar:testnet:${fresh}`).address).toBe(fresh);
  });
});

describe("formatDid", () => {
  it("formats a canonical DID", () => {
    expect(formatDid("testnet", ADDRESS)).toBe(`did:stellar:testnet:${ADDRESS}`);
  });

  it("rejects invalid addresses", () => {
    expect(() => formatDid("testnet", "not-an-address")).toThrow(DidParseError);
  });
});
