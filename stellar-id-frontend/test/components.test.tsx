import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CredentialBadge,
  CredentialExpiredError,
  CredentialRevokedError,
  IdentityLogin,
  IdentityProfileView,
  InvalidProofError,
  withAuth,
} from "../src/index.js";
import type { VerifiableCredential } from "stellar-id-client";
import { fakeSigner, renderWithSession } from "./helpers.js";

vi.mock("stellar-id-client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("stellar-id-client")>();
  return {
    ...mod,
    verifyChallengeResponse: vi.fn(async () => ({
      did: "did:stellar:testnet:GTESTADDRESS",
      address: "GTESTADDRESS",
    })),
  };
});

function credentialFixture(signatureHex = "ab".repeat(64)): VerifiableCredential {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "http://example.edu/credentials/1",
    type: ["VerifiableCredential"],
    issuer: "did:stellar:testnet:GISSUER",
    issuanceDate: "2026-01-01T00:00:00.000Z",
    credentialSubject: { id: "did:stellar:testnet:GSUBJECT" },
    proof: {
      type: "StellarEd25519Proof",
      verificationMethod: "did:stellar:testnet:GISSUER#key-1",
      signatureHex,
    },
  };
}

describe("IdentityLogin", () => {
  it("signs in on click and announces the DID", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    renderWithSession(<IdentityLogin onAuthenticated={(did) => seen.push(did)} />, () =>
      fakeSigner(),
    );
    await user.click(screen.getByRole("button", { name: /sign in with stellar/i }));
    expect(await screen.findByText(/did:stellar:testnet:GTESTADDRESS/)).toBeInTheDocument();
    expect(seen).toEqual(["did:stellar:testnet:GTESTADDRESS"]);
  });

  it("shows an alert on failure", async () => {
    const user = userEvent.setup();
    renderWithSession(<IdentityLogin />, () => ({
      ...fakeSigner(),
      async publicKey(): Promise<string> {
        throw new Error("locked");
      },
    }));
    await user.click(screen.getByRole("button", { name: /sign in with stellar/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderWithSession(<IdentityLogin />, () => fakeSigner());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("IdentityProfileView", () => {
  const did = "did:stellar:testnet:GTESTADDRESS";

  it("renders methods and services", async () => {
    render(
      <IdentityProfileView
        did={did}
        resolve={async () => ({
          did,
          didDocument: {
            "@context": ["https://www.w3.org/ns/did/v1"],
            id: did,
            verificationMethod: [
              {
                id: `${did}#key-1`,
                type: "Multikey",
                controller: did,
                publicKeyMultibase: "z6Mkabc",
              },
            ],
            authentication: [`${did}#key-1`],
            assertionMethod: [],
            service: [
              { id: `${did}#svc`, type: "Demo", serviceEndpoint: "https://example.com" },
            ],
          },
          didResolutionMetadata: { contentType: "application/did+ld+json" },
          didDocumentMetadata: {
            created: 1,
            updated: 2,
            versionId: 1,
            method: { stellarAccount: "GTESTADDRESS" },
          },
        })}
      />,
    );
    expect(await screen.findByText(`${did}#key-1`)).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  // NOTE: each case uses a distinct DID because useDidDocument caches by
  // DID; sharing one would leak resolved documents between cases.
  it("shows a loading state while resolving", () => {
    render(
      <IdentityProfileView
        did={`${did}-loading`}
        resolve={() => new Promise(() => undefined as never)}
      />,
    );
    expect(screen.getByText(/loading identity/i)).toBeInTheDocument();
  });

  it("reports resolution errors", async () => {
    render(
      <IdentityProfileView
        did={`${did}-broken`}
        resolve={async () => {
          throw new InvalidProofError("gone");
        }}
      />,
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("has no axe violations on the loaded state", async () => {
    const { container } = render(
      <IdentityProfileView
        did={did}
        resolve={async () => ({
          did,
          didDocument: {
            "@context": ["https://www.w3.org/ns/did/v1"],
            id: did,
            verificationMethod: [],
            authentication: [],
            assertionMethod: [],
            service: [],
          },
          didResolutionMetadata: { contentType: "application/did+ld+json" },
          didDocumentMetadata: {
            created: 1,
            updated: 1,
            versionId: 1,
            method: { stellarAccount: "GTESTADDRESS" },
          },
        })}
      />,
    );
    await screen.findByText("Identity");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CredentialBadge", () => {
  // NOTE: each case uses a distinct signatureHex because useCredential
  // caches by signature; sharing one fixture would leak state between cases.
  it.each([
    ["valid", "aa", async () => ({ valid: true as const, did: "d", hash: "h" }), "Valid credential"],
    ["revoked", "bb", async () => { throw new CredentialRevokedError("ab"); }, "Revoked credential"],
    ["expired", "cc", async () => { throw new CredentialExpiredError("ab"); }, "Expired credential"],
    ["unknown", "dd", async () => { throw new InvalidProofError("x"); }, "Unknown credential"],
  ])("shows %s", async (_name, sig, verify, label) => {
    render(<CredentialBadge credential={credentialFixture(sig.repeat(64))} verify={verify} />);
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("renders idle without a credential", () => {
    render(<CredentialBadge credential={null} />);
    expect(screen.getByText("No credential")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <CredentialBadge
        credential={credentialFixture()}
        verify={async () => ({ valid: true as const, did: "d", hash: "h" })}
      />,
    );
    await screen.findByText("Valid credential");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("withAuth", () => {
  function Secret() {
    return <p>classified</p>;
  }

  it("gates content behind authentication", async () => {
    const user = userEvent.setup();
    const Guarded = withAuth(Secret);
    renderWithSession(
      <>
        <IdentityLogin />
        <Guarded />
      </>,
      () => fakeSigner(),
    );
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /sign in with stellar/i }));
    });
    expect(await screen.findByText("classified")).toBeInTheDocument();
  });

  it("supports a custom fallback", () => {
    const Guarded = withAuth(Secret, { fallback: <p>locked out</p> });
    renderWithSession(<Guarded />, () => fakeSigner());
    expect(screen.getByText("locked out")).toBeInTheDocument();
  });
});
