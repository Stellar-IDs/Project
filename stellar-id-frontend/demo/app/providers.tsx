"use client";

/**
 * Client-side session wiring for the demo.
 *
 * Signer sources (testnet only):
 * - `?demowallet=1`: throwaway in-browser keypair, friendbot-funded, for
 *   automation (Playwright) and one-click tries. Never use with real funds.
 * - Manual secret entry below (also testnet-only).
 * Real-wallet (Freighter etc.) testing follows the manual steps in the demo
 * README; the library's WalletsKitSigner is interface-tested in CI.
 */
import "stellar-id-frontend/styles.css";
import { createContext, useContext, useEffect, useState } from "react";
import { Buffer } from "buffer";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { SessionProvider } from "stellar-id-frontend";
import type { Signer } from "stellar-id-client";
import { KeypairSigner } from "stellar-id-client";

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
 * Demo providers: session with a pluggable demo signer.
 *
 * @param children - Page content.
 * @param autoWallet - Fund and use a throwaway wallet automatically.
 */
export function DemoProviders({
  children,
  autoWallet,
}: {
  children: React.ReactNode;
  autoWallet: boolean;
}) {
  const [secret, setSecret] = useState("");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [booting, setBooting] = useState(autoWallet);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoWallet || signer !== null) {
      return;
    }
    let cancelled = false;
    fundedThrowaway()
      .then((next) => {
        if (!cancelled) {
          setSigner(next);
          setBooting(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setBooting(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [autoWallet, signer]);

  const useManual = () => {
    const trimmed = secret.trim();
    try {
      // Validate before adopting (throws on garbage).
      StrKey.decodeEd25519SecretSeed(trimmed);
      setSigner(KeypairSigner.fromSecret(trimmed));
      setError(null);
    } catch {
      setError("That does not look like a valid S... secret.");
    }
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
        {booting ? (
          <p role="status">Funding demo wallet…</p>
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
