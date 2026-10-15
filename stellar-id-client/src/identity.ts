/**
 * Identity lifecycle: create, update, and deactivate DIDs.
 *
 * Every mutation is simulated first (surfacing contract rejections before
 * anything is signed), then signed by the caller's {@link Signer},
 * submitted, and polled to finality. Transport errors are retried with
 * backoff; contract rejections never are.
 */
import type { NewDidDoc } from "./generated/index.js";
import { parseDid } from "./did.js";
import type { ParsedDid } from "./did.js";
import { submitMutation } from "./gateway.js";
import type { SubmitOptions } from "./gateway.js";
import type { NetworkConfig } from "./networks.js";
import { testnetConfig } from "./networks.js";
import type { Signer } from "./signers.js";

/** Submitted transaction reference. */
export interface TxResult {
  /** Transaction hash (hex). */
  hash: string;
}

/** A verification method to register at creation time. */
export interface NewKey {
  /** Fragment id, e.g. `"key-1"`. */
  id: string;
  /** Raw 32-byte Ed25519 public key as 64-char hex. */
  publicKeyHex: string;
}

/** A service endpoint to register at creation time. */
export interface NewService {
  /** Fragment id, e.g. `"credential-issuer"`. */
  id: string;
  /** Service type. */
  kind: string;
  /** `https://` endpoint URL. */
  endpoint: string;
}

/** Options for {@link createIdentity}. */
export interface CreateIdentityOptions {
  /** Authorizing signer; its address becomes the DID controller. */
  signer: Signer;
  /** Network to create on (defaults to testnet). */
  network?: NetworkConfig;
  /** Initial verification methods (all join both relationships). */
  keys?: NewKey[];
  /** Initial service endpoints. */
  services?: NewService[];
  /** Resilience options (retry/timeout). */
  submit?: SubmitOptions;
}

/** A created identity: its DID plus the creation transaction. */
export interface Identity extends TxResult {
  /** The canonical DID string. */
  did: string;
  /** Parsed DID parts. */
  parsed: ParsedDid;
}

/**
 * Create a new on-chain DID controlled by the signer.
 *
 * One DID per controlling address: creating twice for the same address
 * fails at simulation time.
 *
 * @param opts - Signer, network, and optional initial keys/services.
 * @returns The DID and creation transaction hash.
 */
export async function createIdentity(opts: CreateIdentityOptions): Promise<Identity> {
  const network = opts.network ?? testnetConfig();
  const address = await opts.signer.publicKey();
  const canonicalDid = `did:stellar:${network.network}:${address}`;
  // Validate the derived DID before spending any fees.
  const parsed = parseDid(canonicalDid);
  const keyIds = (opts.keys ?? []).map((k) => k.id);
  const doc: NewDidDoc = {
    controller: address,
    verification_methods: (opts.keys ?? []).map((k) => ({
      id: k.id,
      kind: "Ed25519",
      public_key: Buffer.from(k.publicKeyHex, "hex"),
    })),
    authentication: keyIds,
    assertion_method: keyIds,
    services: (opts.services ?? []).map((s) => ({ ...s })),
  };
  const hash = await submitMutation(
    async (client) => client.create_did({ controller: address, doc }),
    opts.signer,
    network,
    canonicalDid,
    opts.submit,
  );
  return { did: canonicalDid, parsed, hash };
}

/** A patch applied by {@link updateIdentity} (each entry = one transaction). */
export interface IdentityPatch {
  /** Verification methods to add. */
  addKeys?: NewKey[];
  /** Verification-method fragment ids to remove. */
  removeKeyIds?: string[];
  /** Full replacement for `authentication` (must reference existing keys). */
  authentication?: string[];
  /** Full replacement for `assertion_method` (must reference existing keys). */
  assertionMethod?: string[];
  /** Service endpoints to add. */
  addServices?: NewService[];
  /** Service fragment ids to remove. */
  removeServiceIds?: string[];
}

/** Options for {@link updateIdentity} and {@link deactivateIdentity}. */
export interface MutateOptions {
  /** Authorizing signer (must be the DID controller). */
  signer: Signer;
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Resilience options (retry/timeout). */
  submit?: SubmitOptions;
}

/**
 * Apply a patch to a DID. Entries run as separate transactions in a fixed
 * order: additions, relationship replacement, removals. Stops at the first
 * failure and reports completed hashes.
 *
 * @param did - The DID string to update.
 * @param patch - The changes to apply.
 * @param opts - Signer, network, resilience options.
 * @returns The transaction hashes in execution order.
 */
export async function updateIdentity(
  did: string,
  patch: IdentityPatch,
  opts: MutateOptions,
): Promise<TxResult[]> {
  const { address } = parseDid(did);
  const network = opts.network ?? testnetConfig();
  const results: TxResult[] = [];
  const run = async (
    build: Parameters<typeof submitMutation>[0],
  ): Promise<void> => {
    const hash = await submitMutation(build, opts.signer, network, did, opts.submit);
    results.push({ hash });
  };
  for (const key of patch.addKeys ?? []) {
    await run(async (client) =>
      client.add_verification_method({
        controller: address,
        vm: { id: key.id, kind: "Ed25519", public_key: Buffer.from(key.publicKeyHex, "hex") },
      }),
    );
  }
  for (const svc of patch.addServices ?? []) {
    await run(async (client) =>
      client.add_service({ controller: address, svc: { ...svc } }),
    );
  }
  if (patch.authentication !== undefined || patch.assertionMethod !== undefined) {
    const authentication = patch.authentication ?? [];
    const assertion_method = patch.assertionMethod ?? [];
    await run(async (client) =>
      client.set_relationships({ controller: address, authentication, assertion_method }),
    );
  }
  for (const id of patch.removeKeyIds ?? []) {
    await run(async (client) =>
      client.remove_verification_method({ controller: address, vm_id: id }),
    );
  }
  for (const id of patch.removeServiceIds ?? []) {
    await run(async (client) => client.remove_service({ controller: address, svc_id: id }));
  }
  return results;
}

/**
 * Deactivate a DID (terminal). Afterwards the DID resolves to a tombstone
 * and every mutation is rejected on-chain.
 *
 * @param did - The DID string to deactivate.
 * @param opts - Signer, network, resilience options.
 * @returns The deactivation transaction hash.
 */
export async function deactivateIdentity(did: string, opts: MutateOptions): Promise<TxResult> {
  const { address } = parseDid(did);
  const network = opts.network ?? testnetConfig();
  const hash = await submitMutation(
    async (client) => client.deactivate_did({ controller: address }),
    opts.signer,
    network,
    did,
    opts.submit,
  );
  return { hash };
}
