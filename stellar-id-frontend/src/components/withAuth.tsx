"use client";

/**
 * Client-side route/component protection.
 *
 * Renders the wrapped component only for authenticated sessions. This is a
 * UX convenience, not a security boundary: with the Next.js App Router,
 * real protection must additionally happen server-side (the HOC cannot see
 * httpOnly session cookies and client checks are bypassable). Document this
 * wherever the HOC is used.
 */
import type { ComponentType } from "react";
import { useIdentityStatus } from "../session/SessionProvider.js";

/** Options for {@link withAuth}. */
export interface WithAuthOptions {
  /** Shown while the session state is loading or unauthenticated. */
  fallback?: React.JSX.Element;
}

/**
 * Wrap a component so it only renders when authenticated.
 *
 * @param Component - The protected component.
 * @param opts - Optional fallback element.
 * @returns The guarded component.
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  opts?: WithAuthOptions,
): (props: P) => React.JSX.Element {
  function Guarded(props: P): React.JSX.Element {
    const { isAuthenticated } = useIdentityStatus();
    if (!isAuthenticated) {
      return opts?.fallback ?? <p>Please sign in to continue.</p>;
    }
    return <Component {...props} />;
  }
  Guarded.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;
  return Guarded;
}
