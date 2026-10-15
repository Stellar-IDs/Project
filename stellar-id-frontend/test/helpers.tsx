/**
 * Shared test fakes: signers and a session renderer.
 */
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import type { Signer } from "stellar-id-client";
import { SessionProvider } from "../src/index.js";

/** A signer that answers immediately with canned values. */
export function fakeSigner(
  address = "GTESTADDRESS",
  overrides?: Partial<Signer>,
): Signer & { signMessage: (message: Uint8Array) => Promise<Uint8Array> } {
  return {
    async publicKey() {
      return address;
    },
    async signTransaction(xdr: string) {
      return `${xdr}:signed`;
    },
    async signMessage() {
      return new Uint8Array(64).fill(7);
    },
    ...overrides,
  };
}

/** Render UI under a SessionProvider wired to a fake signer factory. */
export function renderWithSession(
  ui: ReactElement,
  createSigner: () => Signer | Promise<Signer> = () => fakeSigner(),
): RenderResult {
  return render(
    <SessionProvider config={{ createSigner }}>{ui}</SessionProvider>,
  );
}
