"use client";

/**
 * Session state: wallet connection + authenticated identity.
 *
 * The provider owns wallet connection and the challenge/response sign-in
 * flow (via stellar-id-client). Real session artifacts (cookies, JWTs)
 * stay the app backend's job. SSR-safe: nothing touches `window` at import
 * time; the default domain resolves inside the sign-in handler.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  InMemoryNonceStore,
  StellarIdError,
  challengeBytes,
  createChallenge,
  verifyChallengeResponse,
} from "stellar-id-client";
import type { NetworkConfig, Signer } from "stellar-id-client";
import { testnetConfig } from "stellar-id-client";
import { toHex } from "../utils/hex.js";

/** Connection/authentication lifecycle status. */
export type SessionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticating"
  | "authenticated"
  | "error";

/** Session state snapshot. */
export interface SessionState {
  /** Current lifecycle status. */
  status: SessionStatus;
  /** Connected wallet address, if any. */
  address: string | null;
  /** Authenticated DID, if any. */
  did: string | null;
  /** Last error, when status is `error`. */
  error: StellarIdError | null;
}

/** Session actions. */
export interface SessionActions {
  /** Connect the wallet (no authentication yet). */
  connect(): Promise<void>;
  /** Forget connection and identity. */
  disconnect(): void;
  /** Connect (if needed) and run the challenge/response sign-in. */
  signIn(): Promise<void>;
}

/** Provider configuration. */
export interface SessionConfig {
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Build the signer (wallet-owned; called on connect). */
  createSigner: () => Signer | Promise<Signer>;
  /** Challenge domain override (defaults to the page hostname in browsers). */
  domain?: string;
}

const SessionStateContext = createContext<SessionState | null>(null);
const SessionActionsContext = createContext<SessionActions | null>(null);

/**
 * Provide wallet connection + identity session state to the tree.
 *
 * @param children - App content.
 * @param config - Network, signer factory, and optional domain.
 */
export function SessionProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: SessionConfig;
}): React.JSX.Element {
  const network = useMemo(() => config.network ?? testnetConfig(), [config.network]);
  const nonceStore = useMemo(() => new InMemoryNonceStore(), []);
  const [state, setState] = useState<SessionState>({
    status: "disconnected",
    address: null,
    did: null,
    error: null,
  });
  // Ref mirrors the connected signer so signIn can chain connect→sign-in
  // without waiting for a re-render.
  const signerRef = useRef<Signer | null>(null);

  const connectInternal = useCallback(async (): Promise<{
    signer: Signer;
    address: string;
  } | null> => {
    setState({ status: "connecting", address: null, did: null, error: null });
    try {
      const next = await config.createSigner();
      const address = await next.publicKey();
      signerRef.current = next;
      setState({ status: "connected", address, did: null, error: null });
      return { signer: next, address };
    } catch (err) {
      signerRef.current = null;
      setState({
        status: "error",
        address: null,
        did: null,
        error:
          err instanceof StellarIdError
            ? err
            : new StellarIdError("Failed to connect the wallet.", "WALLET", err),
      });
      return null;
    }
  }, [config]);

  const connect = useCallback(async () => {
    await connectInternal();
  }, [connectInternal]);

  const signIn = useCallback(async () => {
    let active = signerRef.current;
    if (active === null) {
      const connected = await connectInternal();
      if (connected === null) {
        return;
      }
      active = connected.signer;
    }
    const signer: Signer = active;
    setState((prev) => ({ ...prev, status: "authenticating", error: null }));
    try {
      const signerAddress = await signer.publicKey();
      const domain =
        config.domain ??
        (typeof window === "undefined" ? "unknown" : window.location.hostname);
      const challenge = createChallenge({ domain, address: signerAddress });
      if (signer.signMessage === undefined) {
        throw new StellarIdError("The connected wallet cannot sign messages.", "WALLET");
      }
      const signature = await signer.signMessage(challengeBytes(challenge));
      const auth = await verifyChallengeResponse(
        {
          challenge,
          address: signerAddress,
          signatureHex: toHex(signature),
          domain,
        },
        { network, nonceStore },
      );
      setState({ status: "authenticated", address: auth.address, did: auth.did, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error:
          err instanceof StellarIdError
            ? err
            : new StellarIdError("Sign-in failed.", "INVALID_PROOF", err),
      }));
    }
  }, [connectInternal, config, network, nonceStore]);

  const disconnect = useCallback(() => {
    signerRef.current = null;
    setState({ status: "disconnected", address: null, did: null, error: null });
  }, []);

  const actions = useMemo(() => ({ connect, disconnect, signIn }), [connect, disconnect, signIn]);

  return (
    <SessionStateContext.Provider value={state}>
      <SessionActionsContext.Provider value={actions}>
        {children}
      </SessionActionsContext.Provider>
    </SessionStateContext.Provider>
  );
}

/**
 * Read the full session state (status, address, DID, error).
 *
 * @returns The session state; must be used under a `SessionProvider`.
 */
export function useSession(): SessionState {
  const state = useContext(SessionStateContext);
  if (state === null) {
    throw new Error("useSession must be used under a SessionProvider");
  }
  return state;
}

/**
 * Session actions (connect, disconnect, signIn).
 *
 * @returns The session actions; must be used under a `SessionProvider`.
 */
export function useSessionActions(): SessionActions {
  const actions = useContext(SessionActionsContext);
  if (actions === null) {
    throw new Error("useSessionActions must be used under a SessionProvider");
  }
  return actions;
}

/**
 * Identity-focused session subset: DID, address, and status.
 *
 * @returns The identity slice of the session.
 */
export function useIdentity(): {
  did: string | null;
  address: string | null;
  status: SessionStatus;
} {
  const { did, address, status } = useSession();
  return { did, address, status };
}

/**
 * Lightweight connection/authentication status flags.
 *
 * @returns The status string plus derived booleans.
 */
export function useIdentityStatus(): {
  status: SessionStatus;
  isConnected: boolean;
  isAuthenticated: boolean;
} {
  const { status } = useSession();
  return {
    status,
    isConnected:
      status === "connected" || status === "authenticating" || status === "authenticated",
    isAuthenticated: status === "authenticated",
  };
}
