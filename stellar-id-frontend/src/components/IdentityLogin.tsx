"use client";

/**
 * Wallet connect + challenge/response sign-in button.
 *
 * Drives `useSessionActions().signIn()` (connects first when needed) and
 * narrates progress through an `aria-live` region. Calls
 * `onAuthenticated(did)` once when sign-in completes.
 */
import { useEffect, useRef, useState } from "react";
import { useIdentityStatus, useSession, useSessionActions } from "../session/SessionProvider.js";
import "./IdentityLogin.css";

/** Props for {@link IdentityLogin}. */
export interface IdentityLoginProps {
  /** Called once with the DID when sign-in completes. */
  onAuthenticated?: (did: string) => void;
  /** Override the button label. */
  label?: string;
}

/**
 * Sign-in button: connect wallet → sign challenge → authenticated.
 *
 * @param props - Label and completion callback.
 */
export function IdentityLogin({
  onAuthenticated,
  label = "Sign in with Stellar",
}: IdentityLoginProps): React.JSX.Element {
  const { status, error } = useSession();
  const { isAuthenticated } = useIdentityStatus();
  const { signIn, disconnect } = useSessionActions();
  const [busy, setBusy] = useState(false);
  const announcedDid = useRef<string | null>(null);
  const { did } = useSession();

  useEffect(() => {
    if (isAuthenticated && did !== null && announcedDid.current !== did) {
      announcedDid.current = did;
      onAuthenticated?.(did);
    }
    if (!isAuthenticated) {
      announcedDid.current = null;
    }
  }, [isAuthenticated, did, onAuthenticated]);

  const busyNow = busy || status === "connecting" || status === "authenticating";

  const handleSignIn = async (): Promise<void> => {
    setBusy(true);
    try {
      await signIn();
    } finally {
      setBusy(false);
    }
  };

  if (isAuthenticated && did !== null) {
    return (
      <div className="sid-login">
        <p className="sid-login__status" role="status">
          Signed in as <span className="sid-login__did">{did}</span>
        </p>
        <button type="button" className="sid-button sid-button--secondary" onClick={disconnect}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="sid-login">
      <button
        type="button"
        className="sid-button sid-button--primary"
        onClick={() => void handleSignIn()}
        disabled={busyNow}
        aria-busy={busyNow}
      >
        {status === "authenticating"
          ? "Waiting for wallet signature…"
          : status === "connecting"
            ? "Connecting wallet…"
            : label}
      </button>
      <div className="sid-login__live" aria-live="polite">
        {status === "error" && error !== null ? (
          <p className="sid-login__error" role="alert">
            Sign-in failed: {error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
