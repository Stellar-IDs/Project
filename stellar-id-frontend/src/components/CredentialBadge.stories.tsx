import type { Meta, StoryObj } from "@storybook/react";
import { CredentialRevokedError, CredentialExpiredError } from "stellar-id-client";
import { CredentialBadge } from "./CredentialBadge.js";
import type { VerifiableCredential } from "stellar-id-client";

const CREDENTIAL: VerifiableCredential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  id: "http://example.edu/credentials/1",
  type: ["VerifiableCredential"],
  issuer: "did:stellar:testnet:GDEMO",
  issuanceDate: "2026-01-01T00:00:00.000Z",
  credentialSubject: { id: "did:stellar:testnet:GSUBJECT" },
  proof: {
    type: "StellarEd25519Proof",
    verificationMethod: "did:stellar:testnet:GDEMO#key-1",
    signatureHex: "ab".repeat(64),
  },
};

const meta: Meta<typeof CredentialBadge> = {
  title: "Credentials/CredentialBadge",
  component: CredentialBadge,
};

export default meta;
type Story = StoryObj<typeof CredentialBadge>;

/** Valid credential. */
export const Valid: Story = {
  args: {
    credential: CREDENTIAL,
    verify: async () => ({ valid: true as const, did: CREDENTIAL.issuer, hash: "ab" }),
  },
};

/** Revoked on-chain. */
export const Revoked: Story = {
  args: {
    credential: CREDENTIAL,
    verify: async () => {
      throw new CredentialRevokedError("ab");
    },
  },
};

/** Expired on-chain. */
export const Expired: Story = {
  args: {
    credential: CREDENTIAL,
    verify: async () => {
      throw new CredentialExpiredError("ab");
    },
  },
};

/** Checking (verifier never settles). */
export const Checking: Story = {
  args: {
    credential: CREDENTIAL,
    verify: () => new Promise(() => undefined as never),
  },
};

/** Dark theme. */
export const Dark: Story = {
  args: {
    credential: CREDENTIAL,
    verify: async () => ({ valid: true as const, did: CREDENTIAL.issuer, hash: "ab" }),
  },
  decorators: [
    (Story) => (
      <div data-sid-theme="dark" style={{ padding: 16, background: "#111827" }}>
        <Story />
      </div>
    ),
  ],
};
