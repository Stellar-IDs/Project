/**
 * Signer abstraction: everything that can authorize for an address.
 *
 * Mutations need two capabilities: signing transaction envelopes
 * (required) and signing raw messages for challenges (optional — wallets
 * vary in message-signing support, see the README wallet matrix).
 */
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { WalletError } from "./errors.js";

/** Options passed to transaction signing. */
export interface SignTransactionOptions {
  /** Network passphrase the transaction is intended for. */
  networkPassphrase: string;
}

/**
 * An entity able to sign for a Stellar address.
 */
export interface Signer {
  /** The `G...` address this signer authorizes for. */
  publicKey(): Promise<string>;
  /**
   * Sign a base64 transaction envelope XDR.
   *
   * @param xdr - Unsigned transaction envelope (base64 XDR).
   * @param opts - The network passphrase (replay protection).
   * @returns The signed envelope (base64 XDR).
   */
  signTransaction(xdr: string, opts: SignTransactionOptions): Promise<string>;
  /**
   * Sign raw message bytes (challenge flow). Absent when the backend
   * cannot sign messages.
   *
   * @param message - Bytes to sign.
   * @returns The 64-byte Ed25519 signature.
   */
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}

/**
 * In-process signer backed by a secret seed. For Node/test/CI use —
 * never ship a secret seed in browser code.
 */
export class KeypairSigner implements Signer {
  private readonly keypair: Keypair;

  private constructor(keypair: Keypair) {
    this.keypair = keypair;
  }

  /**
   * Build a signer from a secret seed (`S...`).
   *
   * @param secret - The secret seed. Keep it out of git, logs, and bundles.
   * @returns The signer.
   */
  static fromSecret(secret: string): KeypairSigner {
    return new KeypairSigner(Keypair.fromSecret(secret));
  }

  /** @returns The `G...` address. */
  async publicKey(): Promise<string> {
    return this.keypair.publicKey();
  }

  /**
   * Sign a transaction envelope with the secret key.
   *
   * @param xdr - Unsigned envelope (base64 XDR).
   * @param opts - Must carry the intended network passphrase.
   * @returns The signed envelope (base64 XDR).
   */
  async signTransaction(xdr: string, opts: SignTransactionOptions): Promise<string> {
    const tx = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);
    if (typeof tx.sign !== "function") {
      throw new WalletError("transaction envelope is not signable (fee-bump not supported)");
    }
    tx.sign(this.keypair);
    return tx.toXDR();
  }

  /**
   * Sign message bytes with the secret key.
   *
   * @param message - Bytes to sign.
   * @returns The 64-byte Ed25519 signature.
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return Uint8Array.from(this.keypair.sign(Buffer.from(message)));
  }
}

/**
 * Structural subset of `@creit.tech/stellar-wallets-kit` used by the
 * adapter. The real kit's static methods satisfy this interface, and tests
 * inject fakes — the SDK never constructs the kit itself (browser apps own
 * wallet selection UI and kit lifecycle).
 */
export interface WalletKitLike {
  /** @returns The connected wallet address. */
  getAddress(): Promise<{ address: string }>;
  /**
   * Ask the wallet to sign a transaction envelope.
   *
   * @param xdr - Unsigned envelope (base64 XDR).
   * @param opts - Passphrase/address hints for the wallet.
   */
  signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string },
  ): Promise<{ signedTxXdr: string; signerAddress?: string }>;
  /**
   * Ask the wallet to sign a message. Optional because support varies by
   * wallet (see the README matrix). Expects base64 in/out (Freighter
   * convention).
   */
  signMessage?(message: string, opts?: { address?: string }): Promise<{
    signedMessage: string;
    signerAddress?: string;
  }>;
}

// TODO(wave: client-2): additional connectors, auth-entry signing for
// smart-wallet flows, and wallet capability detection implement `Signer`.
/**
 * Browser signer that delegates to Stellar Wallets Kit (Freighter, xBull,
 * Albedo, LOBSTR, and others via the kit).
 */
export class WalletsKitSigner implements Signer {
  private cachedAddress: string | undefined;

  /**
   * @param kit - An initialized kit (or compatible fake in tests).
   * @param address - Optional pinned address; otherwise read from the kit.
   */
  constructor(
    private readonly kit: WalletKitLike,
    address?: string,
  ) {
    this.cachedAddress = address;
  }

  /** @returns The connected wallet address. */
  async publicKey(): Promise<string> {
    if (this.cachedAddress === undefined) {
      try {
        const res = await this.kit.getAddress();
        this.cachedAddress = res.address;
      } catch (err) {
        throw new WalletError("failed to read wallet address", err);
      }
    }
    return this.cachedAddress;
  }

  /**
   * Ask the wallet to sign a transaction envelope.
   *
   * @param xdr - Unsigned envelope (base64 XDR).
   * @param opts - Passphrase (and implicitly the connected address).
   * @returns The signed envelope (base64 XDR).
   * @throws {WalletError} If the wallet refuses or fails.
   */
  async signTransaction(xdr: string, opts: SignTransactionOptions): Promise<string> {
    const address = await this.publicKey();
    try {
      const res = await this.kit.signTransaction(xdr, {
        networkPassphrase: opts.networkPassphrase,
        address,
      });
      return res.signedTxXdr;
    } catch (err) {
      throw new WalletError("wallet refused to sign the transaction", err);
    }
  }

  /**
   * Ask the wallet to sign message bytes (base64 round-trip).
   *
   * @param message - Bytes to sign.
   * @returns The decoded signature bytes.
   * @throws {WalletError} If the wallet lacks message signing.
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (this.kit.signMessage === undefined) {
      throw new WalletError("connected wallet does not support message signing");
    }
    const address = await this.publicKey();
    try {
      const res = await this.kit.signMessage(Buffer.from(message).toString("base64"), {
        address,
      });
      return Uint8Array.from(Buffer.from(res.signedMessage, "base64"));
    } catch (err) {
      throw new WalletError("wallet refused to sign the message", err);
    }
  }
}
