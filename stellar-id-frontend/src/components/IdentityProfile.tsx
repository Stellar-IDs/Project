"use client";

/**
 * Read-only identity profile: DID, verification methods, and services.
 * (MVP is read-only; editing is a Wave issue.)
 */
import { useDidDocument } from "../hooks/useStellarQueries.js";
import { useIdentity } from "../session/SessionProvider.js";
import type { NetworkConfig, ResolutionResult } from "stellar-id-client";
import "./IdentityProfile.css";

/** Props for {@link IdentityProfile} and {@link IdentityProfileView}. */
export interface IdentityProfileProps {
  /** DID to show (`IdentityProfile` defaults to the session DID). */
  did?: string;
  /** Network (defaults to testnet). */
  network?: NetworkConfig;
  /** Injected resolver for tests and stories. */
  resolve?: (did: string, opts?: { network?: NetworkConfig }) => Promise<ResolutionResult>;
}

/**
 * Display a DID document: methods, relationships, and services.
 *
 * Session-independent view: pass the DID explicitly. No provider needed,
 * which keeps tests and stories hermetic.
 *
 * @param props - DID, network, and optional injected resolver.
 */
export function IdentityProfileView({
  did,
  network,
  resolve,
}: {
  did: string | null;
} & Omit<IdentityProfileProps, "did">): React.JSX.Element {
  const { data, error, status } = useDidDocument(did, { network, resolve });

  if (did === null) {
    return (
      <section className="sid-profile" aria-label="Identity profile">
        <p className="sid-profile__empty">No identity selected. Sign in to view a profile.</p>
      </section>
    );
  }
  if (status === "loading" || status === "idle") {
    return (
      <section className="sid-profile" aria-label="Identity profile">
        <p role="status">Loading identity…</p>
      </section>
    );
  }
  if (status === "error" || data === null) {
    return (
      <section className="sid-profile" aria-label="Identity profile">
        <p role="alert" className="sid-profile__error">
          Could not load {did}: {error?.message ?? "unknown error"}
        </p>
      </section>
    );
  }

  const document = data.didDocument;
  if (document === null) {
    return (
      <section className="sid-profile" aria-label="Identity profile">
        <p role="status">No document found for {did}.</p>
      </section>
    );
  }
  const deactivated = data.didDocumentMetadata?.deactivated === true;

  return (
    <section className="sid-profile" aria-label="Identity profile">
      <h2 className="sid-profile__title">Identity</h2>
      <dl className="sid-profile__fields">
        <div>
          <dt>DID</dt>
          <dd className="sid-profile__did">{document.id}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{deactivated ? "Deactivated" : "Active"}</dd>
        </div>
      </dl>
      <h3>Verification methods</h3>
      {document.verificationMethod.length === 0 ? (
        <p className="sid-profile__empty">None.</p>
      ) : (
        <ul className="sid-profile__list">
          {document.verificationMethod.map((vm) => (
            <li key={vm.id}>
              <span className="sid-profile__mono">{vm.id}</span>{" "}
              <span className="sid-profile__muted">({vm.type})</span>
            </li>
          ))}
        </ul>
      )}
      <h3>Services</h3>
      {document.service.length === 0 ? (
        <p className="sid-profile__empty">None.</p>
      ) : (
        <ul className="sid-profile__list">
          {document.service.map((svc) => (
            <li key={svc.id}>
              <span className="sid-profile__mono">{svc.id}</span>{" "}
              <span className="sid-profile__muted">({svc.type})</span>{" "}
              <a href={svc.serviceEndpoint} target="_blank" rel="noreferrer">
                {svc.serviceEndpoint}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// TODO(wave: frontend-2): editing keys/services (with transaction state and
// confirmations) builds on this read-only view.
/**
 * Session-aware profile: shows the session DID unless `did` is given.
 *
 * @param props - Optional DID override, network, and injected resolver.
 */
export function IdentityProfile({
  did: didProp,
  network,
  resolve,
}: IdentityProfileProps): React.JSX.Element {
  const { did: sessionDid } = useIdentity();
  return <IdentityProfileView did={didProp ?? sessionDid} network={network} resolve={resolve} />;
}
