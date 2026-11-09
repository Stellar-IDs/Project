"use client";

/**
 * Client-side session wiring for the demo.
 *
 * Signer sources (testnet only):
 * - `?demowallet=1`: throwaway in-browser keypair, friendbot-funded, for
 *   automation (Playwright) and one-click tries. Never use with real funds.
 * - Manual secret entry below (also testnet-only).
 * Browser-extension wallets (WalletsKitSigner) are not wired in yet; see the
 * demo README for the manual test steps.
 */
import "stellar-id-frontend/styles.css";
import { createContext, useContext, useEffect, useState } from "react";
import { Buffer } from "buffer";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { SessionProvider } from "stellar-id-frontend";
import type { Signer } from "stellar-id-client";
import {
  createIdentity,
  DidNotFoundError,
  KeypairSigner,
  resolveIdentity,
} from "stellar-id-client";

if (typeof globalThis.Buffer === "undefined") {
  (globalThis as Record<string, unknown>)["Buffer"] = Buffer;
}

const DemoSignerContext = createContext<Signer | null>(null);

/**
 * Read the demo signer (null until a wallet is chosen).
 *
 * @returns The active demo signer, if any.
 */
export function useDemoSigner(): Signer | null {
  return useContext(DemoSignerContext);
}

async function fundedThrowaway(): Promise<KeypairSigner> {
  const pair = Keypair.random();
  const res = await fetch(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
  if (!res.ok) {
    throw new Error(`friendbot funding failed: HTTP ${res.status}`);
  }
  return KeypairSigner.fromSecret(pair.secret());
}

/**
 * Sign-in verifies against the on-chain DID, so a new wallet must register
 * one first: the account key becomes `key-1` (authentication + assertion).
 */
async function ensureDid(signer: Signer): Promise<void> {
  const address = await signer.publicKey();
  try {
    await resolveIdentity(`did:stellar:testnet:${address}`);
  } catch (err) {
    if (!(err instanceof DidNotFoundError)) {
      throw err;
    }
    const keyHex = StrKey.decodeEd25519PublicKey(address).toString("hex");
    await createIdentity({ signer, keys: [{ id: "key-1", publicKeyHex: keyHex }] });
  }
}

/**
 * True when the page URL asks for the auto-funded demo wallet.
 *
 * @returns Whether `?demowallet=1` is present.
 */
function wantsAutoWallet(): boolean {
  return new URLSearchParams(window.location.search).get("demowallet") === "1";
}

/**
 * Demo providers: session with a pluggable demo signer. With `?demowallet=1`
 * in the URL, a throwaway wallet is funded and used automatically.
 *
 * @param children - Page content.
 */
export function DemoProviders({ children }: { children: React.ReactNode }) {
  const [secret, setSecret] = useState("");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [booting, setBooting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secretError, setSecretError] = useState<string | null>(null);

  const adopt = (next: Signer, isCancelled: () => boolean = () => false): void => {
    setBooting("Registering your testnet DID…");
    ensureDid(next)
      .then(() => {
        if (!isCancelled()) {
          setSigner(next);
          setBooting(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled()) {
          setError(err instanceof Error ? err.message : String(err));
          setBooting(null);
        }
      });
  };

  useEffect(() => {
    if (signer !== null || !wantsAutoWallet()) {
      return;
    }
    let cancelled = false;
    setBooting("Funding demo wallet…");
    fundedThrowaway()
      .then((next) => {
        if (!cancelled) {
          adopt(next, () => cancelled);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setBooting(null);
        }
      });
    return () => {
      cancelled = true;
    };
    // `adopt` is left out of the deps on purpose: it only touches state
    // setters, and re-running this effect would fund another wallet.
  }, [signer]);

  const useManual = () => {
    const trimmed = secret.trim();
    try {
      // Validate before adopting (throws on garbage).
      StrKey.decodeEd25519SecretSeed(trimmed);
    } catch {
      setSecretError("That does not look like a valid S... secret.");
      return;
    }
    setSecretError(null);
    adopt(KeypairSigner.fromSecret(trimmed));
  };

  if (error !== null) {
    return (
      <main>
        <p role="alert">Demo wallet failed: {error}</p>
      </main>
    );
  }

  if (signer === null) {
    return (
      <main>
        <h1>Stellar Identity Demo</h1>
        <p className="banner">Testnet only — never use real funds or mainnet secrets here.</p>
        {booting !== null ? (
          <p role="status">{booting}</p>
        ) : (
          <section aria-label="Demo wallet setup">
            <p>
              <a href="?demowallet=1">Use an auto-funded demo wallet</a> (throwaway, friendbot)
              or paste a funded testnet secret:
            </p>
            <label>
              Testnet secret (S…)
              <input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button type="button" onClick={useManual}>
              Use this secret
            </button>
            {secretError !== null && <p role="alert">{secretError}</p>}
          </section>
        )}
      </main>
    );
  }

  const createSigner = () => signer;
  return (
    <DemoSignerContext.Provider value={signer}>
      <SessionProvider config={{ createSigner }}>{children}</SessionProvider>
    </DemoSignerContext.Provider>
  );
}
