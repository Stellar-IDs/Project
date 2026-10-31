/**
 * `did:stellar` string parsing and formatting.
 *
 * Canonical form (see `docs/METHOD_SPEC.md` §2 in stellar-id-core):
 * `did:stellar:<network>:<strkey-address>` where network is `testnet` or
 * `public` and the address is a classic `G...` account.
 */
import { StrKey } from "@stellar/stellar-sdk";
import { DidParseError } from "./errors.js";

/** Networks supported by the DID method syntax. */
export type DidNetwork = "testnet" | "public";

// TODO(wave: client-1): types for methods/networks registered via core-1
// extend here; keep `method` as the discriminant.
/** A parsed `did:stellar` identifier. */
export interface ParsedDid {
  /** Always `"stellar"` for this SDK (single-method MVP). */
  method: "stellar";
  /** The network segment of the DID string. */
  network: DidNetwork;
  /** The strkey account address (method-specific ID). */
  address: string;
}

const DID_RE = /^did:stellar:(testnet|public):([A-Za-z0-9]+)$/;

/**
 * Parse a `did:stellar` string into its parts.
 *
 * @param did - The DID string, e.g. `did:stellar:testnet:GABC...`.
 * @returns The parsed method, network, and address.
 * @throws {DidParseError} If the method, network, or address is invalid
 * (the address must be a checksummed `G...` strkey).
 */
export function parseDid(did: string): ParsedDid {
  const match = DID_RE.exec(did);
  if (match === null) {
    throw new DidParseError(did);
  }
  const network = match[1] as DidNetwork;
  const address = match[2] as string;
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new DidParseError(did, "address is not a valid G... strkey");
  }
  return { method: "stellar", network, address };
}

/**
 * Format a canonical `did:stellar` string from its parts.
 *
 * @param network - `"testnet"` or `"public"`.
 * @param address - A valid `G...` strkey address.
 * @returns The canonical DID string.
 * @throws {DidParseError} If the address is not a valid strkey.
 */
export function formatDid(network: DidNetwork, address: string): string {
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new DidParseError(
      `did:stellar:${network}:${address}`,
      "address is not a valid G... strkey",
    );
  }
  return `did:stellar:${network}:${address}`;
}
