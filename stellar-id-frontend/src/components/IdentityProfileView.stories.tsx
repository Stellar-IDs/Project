import type { Meta, StoryObj } from "@storybook/react";
import { IdentityProfileView } from "./IdentityProfile.js";
import type { ResolutionResult } from "stellar-id-client";

const DID = "did:stellar:testnet:GDEMO000000000000000000000000000000000000000000000000";

function loaded(): ResolutionResult {
  return {
    did: DID,
    didDocument: {
      "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/multikey/v1"],
      id: DID,
      verificationMethod: [
        {
          id: `${DID}#key-1`,
          type: "Multikey",
          controller: DID,
          publicKeyMultibase: "z6MkgAnvkP45uNxwCKeNdt6wrYkEjpYX4f7Nrd8MQqFL8Fbn",
        },
      ],
      authentication: [`${DID}#key-1`],
      assertionMethod: [`${DID}#key-1`],
      service: [
        { id: `${DID}#demo`, type: "DemoService", serviceEndpoint: "https://example.com/demo" },
      ],
    },
    didResolutionMetadata: { contentType: "application/did+ld+json" },
    didDocumentMetadata: {
      created: 1792061782,
      updated: 1792063492,
      versionId: 2,
      method: { stellarAccount: "GDEMO" },
    },
  };
}

const meta: Meta<typeof IdentityProfileView> = {
  title: "Identity/IdentityProfile",
  component: IdentityProfileView,
};

export default meta;
type Story = StoryObj<typeof IdentityProfileView>;

/** Loaded profile with one key and one service. */
export const Default: Story = {
  args: { did: DID, resolve: async () => loaded() },
};

/** Loading state (resolver never settles). */
export const Loading: Story = {
  args: { did: DID, resolve: () => new Promise(() => undefined as never) },
};

/** Resolution failure. */
export const ErrorState: Story = {
  args: {
    did: DID,
    resolve: async () => {
      throw new Error("simulated RPC outage");
    },
  },
};

/** Deactivated DID tombstone. */
export const Deactivated: Story = {
  args: {
    did: DID,
    resolve: async () => {
      const base = loaded();
      return {
        ...base,
        didDocument:
          base.didDocument === null
            ? null
            : { ...base.didDocument, verificationMethod: [], service: [] },
        didResolutionMetadata: { contentType: "application/did+ld+json", error: "deactivated" },
        didDocumentMetadata:
          base.didDocumentMetadata === null
            ? null
            : { ...base.didDocumentMetadata, deactivated: true },
      };
    },
  },
};

/** Dark theme. */
export const Dark: Story = {
  args: { did: DID, resolve: async () => loaded() },
  decorators: [
    (Story) => (
      <div data-sid-theme="dark" style={{ padding: 16, background: "#111827" }}>
        <Story />
      </div>
    ),
  ],
};
