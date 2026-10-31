/**
 * DID resolution: read-only lookup of a DID via RPC simulation (free, no
 * signing) and mapping to the DID Resolution shape.
 */
import type { DidRecord } from "./generated/index.js";
import { parseDid } from "./did.js";
import { mapCallError, buildClient, unwrapResult } from "./gateway.js";
import type { NetworkConfig } from "./networks.js";
import { testnetConfig } from "./networks.js";
import { toW3CDocument } from "./w3c.js";
import type { DidDocument } from "./w3c.js";

/** Injected contract reader (the default talks to RPC; tests inject fakes). */
export interface DidReader {
  /**
   * Read the on-chain record for an address.
   *
   * @param address - The controller `G...` address.
   * @returns The on-chain record.
   */
  resolve(address: string): Promise<DidRecord>;
}

/** Options for {@link resolveIdentity}. */
export interface ResolveOptions {
  /** Network to resolve on (defaults to testnet). */
  network?: NetworkConfig;
  /** Injected reader for tests; defaults to a live RPC reader. */
  reader?: DidReader;
}

/** Metadata about the resolution process itself. */
export interface ResolutionMetadata {
  /** Always `application/did+ld+json` on success. */
  contentType: "application/did+ld+json";
  /** Machine-readable failure (`notFound`, `deactivated`), if any. */
  error?: "notFound" | "deactivated";
}

/** Metadata about the resolved document. */
export interface DocumentMetadata {
  /** Ledger creation timestamp (seconds). */
  created: number;
  /** Ledger last-update timestamp (seconds). */
  updated: number;
  /** On-chain version number. */
  versionId: number;
  /** Present and true for tombstones. */
  deactivated?: boolean;
  /** The backing Stellar account. */
  method: { stellarAccount: string };
}

/** DID Resolution result shape. */
export interface ResolutionResult {
  /** The input DID string. */
  did: string;
  /** The rendered JSON-LD document, or a tombstone when deactivated. */
  didDocument: DidDocument | null;
  /** Resolution process metadata. */
  didResolutionMetadata: ResolutionMetadata;
  /** Document metadata. */
  didDocumentMetadata: DocumentMetadata | null;
}

// TODO(wave: client-3): multi-RPC failover, caching, and the archived-entry
// restore flow plug in behind this reader (single RPC endpoint today).
/**
 * Create a live RPC-backed reader.
 *
 * @param network - Network configuration.
 * @returns A reader that simulates `resolve` (no signing, no fee).
 */
export function createDidReader(network: NetworkConfig): DidReader {
  return {
    async resolve(address: string): Promise<DidRecord> {
      const client = buildClient(network);
      const tx = await client.resolve({ controller: address });
      await tx.simulate();
      return unwrapResult(tx.result, address);
    },
  };
}

/**
 * Resolve a `did:stellar` identifier.
 *
 * Deactivated DIDs resolve to a tombstone document (empty keys/services)
 * with `deactivated` metadata — never to `notFound`.
 *
 * @param did - The DID string, e.g. `did:stellar:testnet:GABC...`.
 * @param opts - Network and optional injected reader.
 * @returns The resolution result.
 * @throws {DidParseError} If the DID string is malformed.
 * @throws {DidNotFoundError} If no on-chain record exists.
 * @throws {NetworkError} On transport failures.
 * @throws {SimulationError} On unexpected contract/RPC failures.
 */
export async function resolveIdentity(
  did: string,
  opts?: ResolveOptions,
): Promise<ResolutionResult> {
  const { address } = parseDid(did);
  const network = opts?.network ?? testnetConfig();
  const reader = opts?.reader ?? createDidReader(network);
  let record: DidRecord;
  try {
    record = await reader.resolve(address);
  } catch (err) {
    mapCallError(err, did);
  }
  const document = toW3CDocument(record, did);
  if (record.deactivated) {
    return {
      did,
      didDocument: document,
      didResolutionMetadata: { contentType: "application/did+ld+json", error: "deactivated" },
      didDocumentMetadata: {
        created: Number(record.created),
        updated: Number(record.updated),
        versionId: record.version,
        deactivated: true,
        method: { stellarAccount: address },
      },
    };
  }
  return {
    did,
    didDocument: document,
    didResolutionMetadata: { contentType: "application/did+ld+json" },
    didDocumentMetadata: {
      created: Number(record.created),
      updated: Number(record.updated),
      versionId: record.version,
      method: { stellarAccount: address },
    },
  };
}
