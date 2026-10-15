import { describe, expect, it } from "vitest";
import { Account, Keypair, Memo, Networks, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { KeypairSigner, WalletError, WalletsKitSigner } from "../src/index.js";
import type { WalletKitLike } from "../src/index.js";

const TEST_SEED = StrKey.encodeEd25519SecretSeed(Buffer.alloc(32, 9));
const PASSPHRASE = Networks.TESTNET;

describe("KeypairSigner", () => {
  it("reports its address and round-trips messages", async () => {
    const signer = KeypairSigner.fromSecret(TEST_SEED);
    const address = await signer.publicKey();
    expect(address).toBe(Keypair.fromSecret(TEST_SEED).publicKey());

    const sig = await signer.signMessage(new TextEncoder().encode("hello"));
    expect(sig).toHaveLength(64);
    const ok = Keypair.fromPublicKey(address).verify(Buffer.from("hello"), Buffer.from(sig));
    expect(ok).toBe(true);
  });

  it("signs transaction envelopes verifiably", async () => {
    const signer = KeypairSigner.fromSecret(TEST_SEED);
    const address = await signer.publicKey();
    const tx = new TransactionBuilder(new Account(address, "42"), {
      fee: "100",
      networkPassphrase: PASSPHRASE,
    })
      .addMemo(Memo.text("test"))
      .setTimeout(30)
      .build();
    const signedXdr = await signer.signTransaction(tx.toXDR(), {
      networkPassphrase: PASSPHRASE,
    });
    const parsed = TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
    expect(parsed.signatures).toHaveLength(1);
  });
});

describe("WalletsKitSigner", () => {
  function fakeKit(overrides?: Partial<WalletKitLike>): WalletKitLike {
    return {
      async getAddress() {
        return { address: "GABC" };
      },
      async signTransaction(xdr: string) {
        return { signedTxXdr: `${xdr}:signed` };
      },
      ...overrides,
    };
  }

  it("delegates address and signing to the kit", async () => {
    const signer = new WalletsKitSigner(fakeKit());
    expect(await signer.publicKey()).toBe("GABC");
    expect(
      await signer.signTransaction("unsigned", { networkPassphrase: PASSPHRASE }),
    ).toBe("unsigned:signed");
  });

  it("fails clearly when message signing is unavailable", async () => {
    const { signMessage: _dropped, ...rest } = fakeKit();
    void _dropped;
    const signer = new WalletsKitSigner({ ...rest, signMessage: undefined });
    await expect(signer.signMessage(new Uint8Array([1, 2, 3]))).rejects.toThrow(WalletError);
  });

  it("wraps kit failures in WalletError", async () => {
    const signer = new WalletsKitSigner(
      fakeKit({
        async signTransaction(): Promise<{ signedTxXdr: string }> {
          throw new Error("user rejected");
        },
      }),
    );
    await expect(
      signer.signTransaction("unsigned", { networkPassphrase: PASSPHRASE }),
    ).rejects.toThrow(WalletError);
  });
});
