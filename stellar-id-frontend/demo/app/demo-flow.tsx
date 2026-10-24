"use client";

/**
 * Authenticated demo walkthrough: sign-in, profile, credential panel.
 */
import { IdentityLogin, IdentityProfile, useIdentityStatus } from "stellar-id-frontend";
import { CredentialPanel } from "./credential-panel";
import { useDemoSigner } from "./providers";

/**
 * Demo content (must render under `DemoProviders`).
 */
export function DemoFlow(): React.JSX.Element {
  const { isAuthenticated } = useIdentityStatus();
  const signer = useDemoSigner();
  return (
    <div>
      <IdentityLogin />
      {isAuthenticated && (
        <div>
          <IdentityProfile />
          {signer !== null && <CredentialPanel signer={signer} />}
        </div>
      )}
    </div>
  );
}
